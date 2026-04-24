const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

// Helper: call OpenRouter with retry logic for transient errors
const callOpenRouterWithRetry = async (payload, maxRetries = 2) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Warehouse Manager'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return await response.json();
    }

    const errorBody = await response.json();
    const errorMsg = errorBody.error?.message || JSON.stringify(errorBody.error) || 'OpenRouter API error';
    console.error(`OpenRouter API error (attempt ${attempt + 1}/${maxRetries + 1}):`, JSON.stringify(errorBody, null, 2));

    // Retry on provider errors or 5xx, but not on 4xx client errors (except 429 rate limit)
    const isRetryable = response.status >= 500 || response.status === 429 || errorMsg.includes('Provider returned error');
    if (!isRetryable || attempt === maxRetries) {
      throw new Error(errorMsg);
    }

    // Wait before retrying (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
};

// Helper: validate and normalize image data URL for vision API
const normalizeImageData = (imageBase64) => {
  if (!imageBase64) return null;

  // Extract mime type from data URL
  const mimeMatch = imageBase64.match(/^data:(image\/[^;]+);base64,/);
  if (mimeMatch) {
    const mime = mimeMatch[1];
    // GIF and SVG are not supported by Claude vision - convert to PNG by re-encoding
    if (mime === 'image/gif' || mime === 'image/svg+xml') {
      console.warn(`Unsupported image format for vision API: ${mime}. Image may fail.`);
      return imageBase64.replace(/^data:image\/[^;]+/, 'data:image/png');
    }
    return imageBase64;
  }

  // Raw base64 without data URL prefix
  return `data:image/jpeg;base64,${imageBase64}`;
};

// Helper: make a simple OpenRouter call (no retry, no image)
const callOpenRouter = async (systemPrompt, userPrompt, temperature = 0.7) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'AI Warehouse Manager'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 10000,
      temperature
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenRouter API error');
  }

  return await response.json();
};

// ==================== FLOOR PLAN ANALYZER FUNCTIONS ====================

const analyzeFloorPlan = async (imageBase64, analysisType = 'full') => {
  const startTime = Date.now();

  const prompts = {
    full: `Analyze this floor plan image comprehensively. Provide a detailed analysis with the following sections:

## Room Identification
List all visible rooms with their approximate dimensions in a table format.

## Layout Analysis
Describe the overall layout, traffic flow, and how spaces connect.

## Space Utilization
Rate the efficiency (1-10) and explain how well the space is used.

## Natural Light Assessment
Evaluate window placement and natural light distribution.

## Renovation Potential
List specific improvement opportunities with estimated impact.

Use markdown formatting with headers, bullet points, and tables for clarity.`,

    dimensions: `Extract all room dimensions from this floor plan.

First, provide a formatted markdown table:

## Room Dimensions

| Room | Type | Width (ft) | Length (ft) | Area (sq ft) | Features |
|------|------|------------|-------------|--------------|----------|
| Living Room | living | 15.5 | 20.0 | 310 | 2 windows |

Then provide a summary of total square footage and observations.

CRITICAL: You MUST end your response with this EXACT JSON format in a code block. Use these EXACT field names:

\`\`\`json
[
  {"room_name": "Living Room", "room_type": "living", "width": 15.5, "length": 20.0, "area": 310, "features": "2 windows"},
  {"room_name": "Kitchen", "room_type": "kitchen", "width": 12.0, "length": 14.0, "area": 168, "features": "island"}
]
\`\`\`

The JSON array MUST be the LAST thing in your response. Include ALL rooms. Use exact field names: room_name, room_type, width, length, area, features (numbers as numbers, not strings).`,

    suggestions: `Based on this floor plan, provide detailed renovation suggestions:

## High Priority Recommendations

### 1. [Suggestion Title]
- **Description**: Detailed explanation
- **Category**: Structural/Kitchen/Bathroom/Lighting/Storage
- **Estimated Cost**: $X,XXX - $XX,XXX
- **Difficulty**: Easy/Moderate/Complex
- **Timeline**: X-X weeks

Repeat for each suggestion (provide 5-7 suggestions total).

## Quick Wins (Low Cost, High Impact)
List 3-4 easy improvements that make a big difference.

## Budget Summary
| Priority | Suggestion | Cost Range |
|----------|------------|------------|
| High | ... | $X,XXX |

CRITICAL: You MUST end your response with this EXACT JSON format in a code block:

\`\`\`json
[
  {"title": "Suggestion Title", "description": "Detailed description", "category": "kitchen", "priority": "high", "estimated_cost": 5000, "difficulty": "moderate", "timeline": "2-3 weeks"}
]
\`\`\`

The JSON array MUST be the LAST thing in your response. Include ALL suggestions (5-7 items). Use exact field names. Category must be: structural, kitchen, bathroom, lighting, storage, technology, windows, trim, acoustic, furniture, outdoor, or other.`,

    materials: `Recommend materials for renovating this space based on the floor plan:

## Flooring Recommendations

| Room Type | Material | Brand/Style | Price/sq ft | Durability |
|-----------|----------|-------------|-------------|------------|
| Living | Hardwood | ... | $X-XX | Excellent |

## Countertops & Surfaces
Recommend options for kitchen and bathroom countertops with pros/cons.

## Cabinets & Storage
Style recommendations with finish options and price ranges.

## Paint & Wall Treatments
- **Living Areas**: Color palette suggestions with hex codes
- **Bedrooms**: Calming tones
- **Kitchen/Bath**: Moisture-resistant options

## Fixtures & Hardware
Recommended brands and styles for:
- Lighting fixtures
- Door/cabinet hardware
- Plumbing fixtures

## Budget Summary
| Category | Budget Option | Mid-Range | Premium |
|----------|--------------|-----------|---------|
| Flooring | $X/sqft | $X/sqft | $X/sqft |

CRITICAL: You MUST end your response with this EXACT JSON format in a code block:

\`\`\`json
[
  {"name": "Hardwood Flooring", "category": "flooring", "description": "Oak hardwood for living areas", "unit_price": 8.50, "unit": "sqft", "supplier": "Home Depot"},
  {"name": "Quartz Countertop", "category": "countertop", "description": "White quartz for kitchen", "unit_price": 75, "unit": "sqft", "supplier": "Local Stone"}
]
\`\`\`

The JSON array MUST be the LAST thing in your response. Include ALL recommended materials. Use exact field names: name, category, description, unit_price (number), unit, supplier.`,

    cost: `Provide a detailed cost estimate for renovating this floor plan:

## Cost Summary

| Category | Amount |
|----------|--------|
| Labor | $XX,XXX |
| Materials | $XX,XXX |
| Permits | $X,XXX |
| Contingency (15%) | $X,XXX |
| **Total** | **$XX,XXX** |

## Labor Cost Breakdown

| Trade | Estimated Cost | Days |
|-------|---------------|------|
| Plumbing | $X,XXX | X |
| Electrical | $X,XXX | X |
| Carpentry | $X,XXX | X |
| Painting | $X,XXX | X |

## Material Cost Breakdown

| Category | Cost | Notes |
|----------|------|-------|
| Flooring | $X,XXX | ... |
| Fixtures | $X,XXX | ... |

## Timeline
- **Total Duration**: XX days
- **Phase 1**: Demo & Prep (X days)
- **Phase 2**: Rough Work (X days)
- **Phase 3**: Finishing (X days)

## Cost-Saving Tips
1. Tip with explanation
2. Another tip

CRITICAL: You MUST end your response with this EXACT JSON format in a code block for database storage. Use these EXACT field names:

\`\`\`json
{"labor_cost": 52000, "material_cost": 78000, "total_cost": 156000, "timeline_days": 45}
\`\`\`

The JSON must be the LAST thing in your response and must use these exact field names: labor_cost, material_cost, total_cost, timeline_days (as numbers, not strings).`
  };

  const systemPrompt = `You are an expert interior designer and renovation consultant with 20+ years of experience.
You specialize in analyzing floor plans and providing actionable renovation recommendations.
Always provide specific, practical advice with realistic cost estimates.
Format your responses in a clear, structured manner that can be easily parsed.
When analyzing images, be thorough but concise.`;

  const normalizedImage = normalizeImageData(imageBase64);

  try {
    const data = await callOpenRouterWithRetry({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: normalizedImage ? [
            {
              type: 'text',
              text: prompts[analysisType] || prompts.full
            },
            {
              type: 'image_url',
              image_url: {
                url: normalizedImage
              }
            }
          ] : prompts[analysisType] || prompts.full
        }
      ],
      max_tokens: 10000,
      temperature: 0.7
    });

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      },
      processingTimeMs: processingTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return {
      success: false,
      error: error.message,
      processingTimeMs: Date.now() - startTime
    };
  }
};

const generateRenovationSuggestions = async (roomData) => {
  const startTime = Date.now();

  const prompt = `Based on the following room data, generate detailed renovation suggestions:

Room: ${roomData.name}
Type: ${roomData.room_type}
Dimensions: ${roomData.width || 0}ft x ${roomData.length || 0}ft (${roomData.area || 0} sq ft)
${roomData.notes ? `Notes: ${roomData.notes}` : ''}

Provide exactly 5 specific renovation suggestions. Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Suggestion Title",
    "description": "Detailed description",
    "category": "structural|kitchen|bathroom|lighting|storage|technology|windows|trim|acoustic|furniture|outdoor|other",
    "priority": "high|medium|low",
    "estimated_cost": 5000,
    "difficulty": "easy|moderate|complex",
    "timeline": "2-3 weeks"
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const data = await callOpenRouter(
      'You are an expert renovation consultant. Always respond with valid JSON arrays containing renovation suggestions.',
      prompt,
      0.7
    );

    const content = data.choices[0].message.content;

    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(content);
      }
    } catch {
      suggestions = content;
    }

    return {
      success: true,
      suggestions,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return {
      success: false,
      error: error.message,
      processingTimeMs: Date.now() - startTime
    };
  }
};

const estimateCosts = async (projectDetails) => {
  const startTime = Date.now();

  const prompt = `Provide a detailed cost estimate for the following renovation project:

**Project:** ${projectDetails.name}
**Description:** ${projectDetails.description || 'General renovation'}
**Total Area:** ${projectDetails.total_area || 0} sq ft
**Rooms:** ${projectDetails.rooms?.map(r => `${r.name} (${r.area || 0} sq ft)`).join(', ') || 'No rooms specified'}

## Cost Summary

| Category | Amount |
|----------|--------|
| Labor | $XX,XXX |
| Materials | $XX,XXX |
| Permits | $X,XXX |
| Contingency (15%) | $X,XXX |
| **Total** | **$XX,XXX** |

## Labor Cost Breakdown

| Trade | Estimated Cost | Days |
|-------|---------------|------|
| Plumbing | $X,XXX | X |
| Electrical | $X,XXX | X |
| Carpentry | $X,XXX | X |
| Painting | $X,XXX | X |

## Material Cost Breakdown

| Category | Cost | Notes |
|----------|------|-------|
| Flooring | $X,XXX | ... |
| Fixtures | $X,XXX | ... |

## Timeline
- **Total Duration**: XX days
- **Phase 1**: Demo & Prep (X days)
- **Phase 2**: Rough Work (X days)
- **Phase 3**: Finishing (X days)

## Cost-Saving Tips
1. Tip with explanation
2. Another tip

Use markdown formatting with clear tables and sections.`;

  try {
    const data = await callOpenRouter(
      'You are an expert construction cost estimator. Provide realistic cost estimates based on current market rates. Always respond with structured JSON.',
      prompt,
      0.5
    );

    const content = data.choices[0].message.content;

    let estimateData = null;
    try {
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        estimateData = JSON.parse(codeBlockMatch[1]);
      } else {
        const jsonMatch = content.match(/\{"labor_cost"[\s\S]*?\}/);
        if (jsonMatch) {
          estimateData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error('Failed to parse estimate JSON:', e);
    }

    return {
      success: true,
      estimate: content,
      estimateData: estimateData,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return {
      success: false,
      error: error.message,
      processingTimeMs: Date.now() - startTime
    };
  }
};

const recommendMaterials = async (roomData, style) => {
  const startTime = Date.now();

  const prompt = `Recommend materials for the following room renovation:

**Room:** ${roomData.name}
**Type:** ${roomData.room_type}
**Size:** ${roomData.area || 0} sq ft
**Style Preference:** ${style || 'Modern'}

## Recommended Materials

### Flooring
| Option | Material | Price/sq ft | Pros | Cons |
|--------|----------|-------------|------|------|
| Budget | ... | $X | ... | ... |
| Premium | ... | $X | ... | ... |

### Wall Treatment
Recommended paint colors, wallpaper, or accent wall options.

### Lighting
- **Ambient**: Fixture recommendations
- **Task**: Work area lighting
- **Accent**: Decorative options

### Fixtures & Hardware
Specific product recommendations with price ranges.

## Color Palette
- Primary: #XXXXXX (Color name)
- Secondary: #XXXXXX (Color name)
- Accent: #XXXXXX (Color name)

## Budget Estimate
| Item | Budget | Mid-Range | Premium |
|------|--------|-----------|---------|
| Flooring | $X,XXX | $X,XXX | $X,XXX |
| Paint | $XXX | $XXX | $XXX |
| Fixtures | $XXX | $X,XXX | $X,XXX |

Use markdown formatting with tables and clear sections.`;

  try {
    const data = await callOpenRouter(
      'You are an expert interior designer specializing in material selection. Provide specific, practical recommendations with realistic pricing.',
      prompt,
      0.7
    );

    const content = data.choices[0].message.content;

    let materials = [];
    try {
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        materials = JSON.parse(codeBlockMatch[1]);
      } else {
        const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
          materials = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error('Failed to parse materials JSON:', e);
    }

    return {
      success: true,
      recommendations: content,
      materials: materials,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return {
      success: false,
      error: error.message,
      processingTimeMs: Date.now() - startTime
    };
  }
};

const analyzeLayoutOptimization = async (floorPlanData) => {
  const startTime = Date.now();

  const prompt = `Analyze the following floor plan layout and suggest optimizations:

Floor Plan: ${floorPlanData.name}
Total Area: ${floorPlanData.total_area} sq ft
Rooms:
${floorPlanData.rooms?.map(r => `- ${r.name} (${r.room_type}): ${r.width}ft x ${r.length}ft`).join('\n')}

## Traffic Flow Analysis
Describe the movement patterns through the space:
- Main circulation paths
- Bottlenecks or congestion points
- Recommended improvements

## Space Efficiency Score

| Metric | Score (1-10) | Notes |
|--------|--------------|-------|
| Overall Efficiency | X | ... |
| Room Proportions | X | ... |
| Storage Adequacy | X | ... |
| Functional Zones | X | ... |

**Overall Score: X/10**

## Natural Light Optimization
- Current light distribution analysis
- Window placement effectiveness
- Recommendations for maximizing natural light

## Privacy Considerations
Analyze privacy levels between spaces:

| Zone | Privacy Level | Adjacent To | Recommendations |
|------|--------------|-------------|-----------------|
| Bedrooms | ... | ... | ... |
| Bathrooms | ... | ... | ... |

## Noise Zone Mapping
- **Quiet Zones**: Bedrooms, study areas
- **Active Zones**: Kitchen, living room
- **Buffer Zones**: Hallways, closets
- Soundproofing recommendations

## Furniture Placement Suggestions
Provide specific placement recommendations for each room.

CRITICAL: You MUST end your response with this EXACT JSON format in a code block:

\`\`\`json
{"traffic_flow": "Good flow between main areas", "efficiency_score": 7.5, "natural_light": "Adequate in living areas", "privacy_analysis": "Good separation between zones", "noise_zones": "Kitchen noise may affect bedroom", "furniture_suggestions": "Reposition sofa", "layout_modifications": "Consider opening kitchen to living room"}
\`\`\`

The JSON MUST be the LAST thing in your response. Use exact field names: traffic_flow, efficiency_score (number 1-10), natural_light, privacy_analysis, noise_zones, furniture_suggestions, layout_modifications.`;

  try {
    const data = await callOpenRouter(
      'You are an expert space planner and architect. Analyze layouts for optimal functionality and living experience.',
      prompt,
      0.7
    );

    return {
      success: true,
      optimization: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return {
      success: false,
      error: error.message,
      processingTimeMs: Date.now() - startTime
    };
  }
};

// AI Room Detector - Detects and identifies rooms from floor plan images
const detectRooms = async (imageBase64) => {
  const startTime = Date.now();

  const prompt = `Analyze this floor plan image and detect all rooms. For each room identified:

## Detected Rooms Summary

| # | Room Name | Type | Estimated Size (sq ft) | Confidence |
|---|-----------|------|------------------------|------------|
| 1 | Living Room | living | 300 | High |

## Room Details

### Room 1: [Name]
- **Type**: living/bedroom/kitchen/bathroom/dining/office/garage/utility/hallway/closet
- **Location**: Description of where in the floor plan
- **Approximate Dimensions**: Width x Length
- **Notable Features**: Windows, doors, closets, etc.
- **Confidence Level**: High/Medium/Low

Repeat for each room detected.

## Floor Plan Overview
- Total rooms detected: X
- Total estimated area: X sq ft
- Layout type: Open concept / Traditional / Split-level / etc.

CRITICAL: End your response with this EXACT JSON format:

\`\`\`json
{
  "total_rooms": 5,
  "confidence_score": 85.5,
  "detected_rooms": [
    {"name": "Living Room", "type": "living", "width": 15, "length": 20, "area": 300, "features": ["2 windows", "fireplace"], "confidence": "high"},
    {"name": "Kitchen", "type": "kitchen", "width": 12, "length": 14, "area": 168, "features": ["island", "pantry"], "confidence": "high"}
  ]
}
\`\`\``;

  const normalizedImage = normalizeImageData(imageBase64);

  try {
    const data = await callOpenRouterWithRetry({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert floor plan analyst specializing in room detection and space identification. Analyze floor plans with precision and provide detailed room information.'
        },
        {
          role: 'user',
          content: normalizedImage ? [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: normalizedImage } }
          ] : prompt
        }
      ],
      max_tokens: 10000,
      temperature: 0.5
    });

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

// AI Home Staging Advisor - Provides staging recommendations for real estate
const getHomeStagingAdvice = async (roomData, targetBuyer = 'general') => {
  const startTime = Date.now();

  const prompt = `Provide professional home staging advice for this room to maximize appeal for ${targetBuyer} buyers:

**Room:** ${roomData.name || 'Living Space'}
**Type:** ${roomData.room_type || 'living'}
**Size:** ${roomData.area || 0} sq ft
**Dimensions:** ${roomData.width || 0}ft x ${roomData.length || 0}ft

## Staging Strategy

### Overall Theme
Recommended style that appeals to target buyers.

### Furniture Recommendations

| Item | Style | Placement | Purpose |
|------|-------|-----------|---------|
| Sofa | Modern | Against main wall | Anchor piece |

### Color Palette
- **Walls**: Color recommendation with hex code
- **Accents**: 2-3 complementary colors
- **Textiles**: Suggested fabrics and patterns

### Decluttering Checklist
- [ ] Items to remove
- [ ] Items to add
- [ ] Items to rearrange

### Lighting Improvements
- Natural light optimization
- Artificial lighting suggestions

### Estimated Value Increase
- Staging investment: $X,XXX
- Potential value increase: $X,XXX - $XX,XXX
- ROI: X%

CRITICAL: End with this JSON:

\`\`\`json
{
  "staging_style": "Modern Transitional",
  "target_buyer": "${targetBuyer}",
  "estimated_value_increase": 15000,
  "recommendations": [
    {"category": "furniture", "item": "Neutral sofa", "cost": 800, "impact": "high"},
    {"category": "decor", "item": "Fresh flowers", "cost": 50, "impact": "medium"}
  ]
}
\`\`\``;

  try {
    const data = await callOpenRouter(
      'You are a professional real estate staging consultant with expertise in maximizing property appeal and value. Provide actionable, budget-conscious staging recommendations.',
      prompt,
      0.7
    );

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

// AI Furniture Placer - Optimizes furniture placement
const placeFurniture = async (roomData, style = 'modern') => {
  const startTime = Date.now();

  const prompt = `Create an optimal furniture placement plan for this room:

**Room:** ${roomData.name || 'Room'}
**Type:** ${roomData.room_type || 'living'}
**Dimensions:** ${roomData.width || 12}ft x ${roomData.length || 14}ft (${roomData.area || 168} sq ft)
**Style Preference:** ${style}

## Furniture Layout Plan

### Primary Furniture

| Item | Size (WxD) | Position | Orientation | Distance from Wall |
|------|------------|----------|-------------|-------------------|
| Sofa | 7'x3' | Center-left | Facing TV wall | 18" |

### Traffic Flow Analysis
- Main pathways (minimum 36" clearance)
- Entry/exit points
- Bottlenecks to avoid

### Space Efficiency Score: X/10

### Shopping List

| Priority | Item | Recommended Size | Est. Cost |
|----------|------|-----------------|-----------|
| 1 | Main sofa | 84" | $800-2000 |

CRITICAL: End with this JSON:

\`\`\`json
{
  "layout_score": 8.5,
  "traffic_flow_rating": "excellent",
  "furniture_items": [
    {"name": "Sectional Sofa", "width": 84, "depth": 36, "position_x": 24, "position_y": 48, "rotation": 0},
    {"name": "Coffee Table", "width": 48, "depth": 24, "position_x": 60, "position_y": 72, "rotation": 0}
  ]
}
\`\`\``;

  try {
    const data = await callOpenRouter(
      'You are an expert interior designer specializing in space planning and furniture arrangement. Create functional, aesthetically pleasing layouts that maximize space usage.',
      prompt,
      0.7
    );

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

// AI Home Maintenance Predictor - Predicts maintenance needs
const predictMaintenance = async (floorPlanData, homeAge = 10) => {
  const startTime = Date.now();

  const roomsSummary = floorPlanData.rooms?.map(r => `${r.name} (${r.room_type}): ${r.area || 0} sq ft`).join(', ') || 'No rooms specified';

  const prompt = `Predict maintenance needs for this home:

**Property:** ${floorPlanData.name || 'Home'}
**Total Area:** ${floorPlanData.total_area || 0} sq ft
**Estimated Age:** ${homeAge} years
**Rooms:** ${roomsSummary}

## Annual Maintenance Calendar

### Q1 (Jan-Mar)
| Task | Priority | Est. Cost | DIY? |
|------|----------|-----------|------|
| HVAC filter | High | $30 | Yes |

### Q2 (Apr-Jun)
| Task | Priority | Est. Cost | DIY? |

### Q3 (Jul-Sep)
| Task | Priority | Est. Cost | DIY? |

### Q4 (Oct-Dec)
| Task | Priority | Est. Cost | DIY? |

## Major System Predictions

### HVAC System
- Current estimated condition
- Expected lifespan remaining
- Recommended actions

### Plumbing
- Risk areas based on layout
- Preventive measures

### Electrical
- Capacity assessment
- Upgrade recommendations

## 5-Year Cost Projection

| Year | Routine | Major Repairs | Total |
|------|---------|---------------|-------|

## Priority Action Items
1. Urgent item
2. Important item
3. Recommended item

CRITICAL: End with this JSON:

\`\`\`json
{
  "total_annual_cost": 3500,
  "priority_items": 3,
  "next_maintenance_date": "2026-04-15",
  "predictions": [
    {"item": "HVAC Service", "category": "hvac", "frequency": "annual", "cost": 150, "priority": "high", "next_due": "2026-04-01"},
    {"item": "Gutter Cleaning", "category": "exterior", "frequency": "biannual", "cost": 200, "priority": "medium", "next_due": "2026-05-01"}
  ]
}
\`\`\``;

  try {
    const data = await callOpenRouter(
      'You are a home maintenance expert and property manager with extensive knowledge of residential systems, their lifecycles, and maintenance requirements. Provide practical, prioritized maintenance schedules.',
      prompt,
      0.6
    );

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

// AI Energy Efficiency Auditor - Analyzes energy efficiency
const auditEnergyEfficiency = async (floorPlanData, climateZone = 'temperate') => {
  const startTime = Date.now();

  const roomsSummary = floorPlanData.rooms?.map(r => `${r.name} (${r.room_type}): ${r.area || 0} sq ft`).join(', ') || 'No rooms specified';

  const prompt = `Conduct an energy efficiency audit for this home:

**Property:** ${floorPlanData.name || 'Home'}
**Total Area:** ${floorPlanData.total_area || 0} sq ft
**Climate Zone:** ${climateZone}
**Rooms:** ${roomsSummary}

## Energy Efficiency Score: X/100

### Score Breakdown
| Category | Score | Weight | Contribution |
|----------|-------|--------|--------------|
| Insulation | X/100 | 25% | X |
| Windows | X/100 | 20% | X |
| HVAC | X/100 | 25% | X |
| Lighting | X/100 | 15% | X |
| Appliances | X/100 | 15% | X |

## Current Energy Profile

### Estimated Annual Costs
| Utility | Monthly | Annual |
|---------|---------|--------|
| Electricity | $XXX | $X,XXX |
| Gas/Heating | $XXX | $X,XXX |
| Water | $XX | $XXX |
| **Total** | **$XXX** | **$X,XXX** |

## Improvement Recommendations

### High Impact (ROI < 3 years)
| Upgrade | Cost | Annual Savings | Payback |
|---------|------|----------------|---------|

### Medium Impact (ROI 3-7 years)
| Upgrade | Cost | Annual Savings | Payback |

### Long-term Investments
| Upgrade | Cost | Annual Savings | Payback |

CRITICAL: End with this JSON:

\`\`\`json
{
  "efficiency_score": 72.5,
  "annual_cost_estimate": 2400,
  "potential_savings": 720,
  "carbon_footprint": 8.5,
  "recommendations": [
    {"item": "LED Lighting Upgrade", "category": "lighting", "cost": 300, "annual_savings": 150, "payback_years": 2, "priority": "high"},
    {"item": "Smart Thermostat", "category": "hvac", "cost": 250, "annual_savings": 180, "payback_years": 1.4, "priority": "high"}
  ]
}
\`\`\``;

  try {
    const data = await callOpenRouter(
      'You are a certified energy auditor with expertise in residential energy efficiency, renewable energy, and sustainable building practices. Provide actionable recommendations with clear ROI calculations.',
      prompt,
      0.6
    );

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

// AI Home Inspection Reporter - Generates inspection reports
const generateHomeInspection = async (floorPlanData, inspectionType = 'general') => {
  const startTime = Date.now();

  const roomsSummary = floorPlanData.rooms?.map(r => `${r.name} (${r.room_type}): ${r.area || 0} sq ft`).join(', ') || 'No rooms specified';

  const prompt = `Generate a comprehensive home inspection report:

**Property:** ${floorPlanData.name || 'Property'}
**Total Area:** ${floorPlanData.total_area || 0} sq ft
**Inspection Type:** ${inspectionType}
**Rooms:** ${roomsSummary}

## Executive Summary

**Overall Condition:** Excellent/Good/Fair/Poor
**Recommended Action:** Move-in Ready / Minor Repairs / Major Repairs / Significant Concerns

### Key Findings
- X critical issues
- X major issues
- X minor issues

## Detailed Inspection Report

### Structural Elements
#### Foundation
| Component | Condition | Notes |
|-----------|-----------|-------|

#### Framing
| Component | Condition | Notes |
|-----------|-----------|-------|

### Exterior
#### Roof
- Type, Estimated age, Condition, Remaining lifespan

### Interior Systems
#### Plumbing
| Component | Condition | Notes |
|-----------|-----------|-------|

#### Electrical
| Component | Condition | Notes |
|-----------|-----------|-------|

#### HVAC
| Component | Condition | Age | Notes |
|-----------|-----------|-----|-------|

## Issues Summary

### Critical (Immediate Action Required)
| # | Issue | Location | Est. Repair Cost |
|---|-------|----------|------------------|

### Major (Address Within 6 Months)
| # | Issue | Location | Est. Repair Cost |

### Minor (Routine Maintenance)
| # | Issue | Location | Est. Repair Cost |

## Cost Summary
| Priority | Count | Total Est. Cost |
|----------|-------|-----------------|

CRITICAL: End with this JSON:

\`\`\`json
{
  "inspection_type": "${inspectionType}",
  "overall_condition": "Good",
  "critical_issues": 1,
  "estimated_repair_cost": 8500,
  "issues_found": [
    {"item": "Water heater aging", "location": "Utility room", "severity": "major", "cost": 1500, "priority": 2},
    {"item": "Missing caulk around windows", "location": "Living room", "severity": "minor", "cost": 50, "priority": 5}
  ]
}
\`\`\``;

  try {
    const data = await callOpenRouter(
      'You are a certified home inspector with extensive experience in residential property evaluation. Provide thorough, professional inspection reports that identify issues and estimate repair costs.',
      prompt,
      0.5
    );

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

// ==================== INTERIOR DESIGN FUNCTIONS ====================

const generateDesignSuggestion = async (roomData, style, budget) => {
  const startTime = Date.now();

  const prompt = `Generate interior design suggestions for this room:

**Room:** ${roomData.name || 'Room'}
**Type:** ${roomData.roomType || 'living'}
**Size:** ${roomData.width || 12}ft x ${roomData.length || 14}ft
**Style:** ${style || 'Modern'}
**Budget:** $${budget || 5000}

Provide a complete design plan including:
1. Color scheme with hex codes
2. Furniture recommendations with prices
3. Decor and accessory suggestions
4. Lighting plan
5. Layout optimization tips

Return as structured JSON with design recommendations.`;

  try {
    const data = await callOpenRouter(
      'You are an expert interior designer. Create beautiful, functional designs within budget constraints. Always respond with actionable recommendations.',
      prompt,
      0.8
    );

    return {
      success: true,
      result: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

const generateColorPalette = async (style, mood, roomType) => {
  const startTime = Date.now();

  const prompt = `Generate a color palette for an interior design project:

**Style:** ${style || 'Modern'}
**Mood:** ${mood || 'Calm and inviting'}
**Room Type:** ${roomType || 'Living room'}

Provide a complete color palette with:
1. Primary color (walls)
2. Secondary color (large furniture)
3. Accent color (decorative elements)
4. Neutral base (floors, trim)
5. Pop color (small accents)

For each color provide: name, hex code, RGB values, and where to use it.

Return ONLY valid JSON:
{
  "name": "Palette Name",
  "style": "${style || 'Modern'}",
  "mood": "${mood || 'Calm'}",
  "colors": [
    {"name": "Color Name", "hex": "#XXXXXX", "role": "primary", "usage": "Walls and large surfaces"}
  ]
}`;

  try {
    const data = await callOpenRouter(
      'You are a color theory expert and interior designer. Create harmonious color palettes that evoke specific moods. Always respond with valid JSON.',
      prompt,
      0.8
    );

    const content = data.choices[0].message.content;
    let palette = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        palette = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse palette JSON:', e);
    }

    return {
      success: true,
      result: palette || content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

const generateStyleGuide = async (preferences) => {
  const startTime = Date.now();

  const prompt = `Create a comprehensive interior design style guide based on these preferences:

**Preferred Style:** ${preferences.style || 'Modern'}
**Color Preferences:** ${preferences.colors || 'Neutral with warm accents'}
**Budget Range:** $${preferences.budgetMin || 5000} - $${preferences.budgetMax || 20000}
**Room Types:** ${preferences.roomTypes?.join(', ') || 'All rooms'}
**Special Requirements:** ${preferences.requirements || 'None'}

Provide a complete style guide including:
1. Design philosophy and principles
2. Color palette with hex codes
3. Material recommendations
4. Furniture style guidelines
5. Lighting strategy
6. Textile and pattern guidance
7. Art and accessory suggestions
8. Budget allocation by room`;

  try {
    const data = await callOpenRouter(
      'You are a senior interior designer creating comprehensive style guides. Provide detailed, actionable design direction.',
      prompt,
      0.7
    );

    return {
      success: true,
      result: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

const analyzeRoomImage = async (imageBase64, roomType) => {
  const startTime = Date.now();
  const normalizedImage = normalizeImageData(imageBase64);

  const prompt = `Analyze this ${roomType || 'room'} image and provide:

1. Current style assessment
2. Color analysis
3. Furniture identification
4. Space utilization rating (1-10)
5. Design improvement suggestions
6. Estimated budget for improvements

Be specific and actionable in your recommendations.`;

  try {
    const data = await callOpenRouterWithRetry({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interior designer. Analyze room images and provide detailed, actionable design recommendations.'
        },
        {
          role: 'user',
          content: normalizedImage ? [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: normalizedImage } }
          ] : prompt
        }
      ],
      max_tokens: 10000,
      temperature: 0.7
    });

    return {
      success: true,
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

const generateBudgetPlan = async (designData) => {
  const startTime = Date.now();

  const prompt = `Create a detailed budget plan for this interior design project:

**Project:** ${designData.title || 'Interior Design Project'}
**Total Budget:** $${designData.budget || 10000}
**Style:** ${designData.style || 'Modern'}
**Rooms:** ${designData.rooms?.map(r => r.name).join(', ') || 'All rooms'}

Provide:
1. Budget allocation by category (furniture, decor, lighting, etc.)
2. Priority spending recommendations
3. Where to splurge vs save
4. Phased purchasing plan
5. Alternative options at different price points

Return structured budget breakdown with specific product suggestions and prices.`;

  try {
    const data = await callOpenRouter(
      'You are an interior design budget consultant. Create realistic, detailed budgets that maximize design impact within constraints.',
      prompt,
      0.6
    );

    return {
      success: true,
      result: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return { success: false, error: error.message, processingTimeMs: Date.now() - startTime };
  }
};

module.exports = {
  // Floor Plan Analyzer functions
  analyzeFloorPlan,
  generateRenovationSuggestions,
  estimateCosts,
  recommendMaterials,
  analyzeLayoutOptimization,
  detectRooms,
  getHomeStagingAdvice,
  placeFurniture,
  predictMaintenance,
  auditEnergyEfficiency,
  generateHomeInspection,
  // Interior Design functions
  generateDesignSuggestion,
  generateColorPalette,
  generateStyleGuide,
  analyzeRoomImage,
  generateBudgetPlan,
  // Helpers
  callOpenRouterWithRetry,
  normalizeImageData
};
