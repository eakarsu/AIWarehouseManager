import React from 'react';
import WarehouseFloorMap from '../components/WarehouseFloorMap';
import InventoryTurnover from '../components/InventoryTurnover';
import PickListExporter from '../components/PickListExporter';
import InventoryAdjustWizard from '../components/InventoryAdjustWizard';

export default function CustomViewsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Analytics</h1>
        <p className="text-gray-500 mt-1">
          Bespoke views: floor-fill / pick-frequency heatmap, inventory turnover
          trends, pick-list PDF exports, and bulk inventory adjustments.
        </p>
      </div>

      <WarehouseFloorMap />
      <InventoryTurnover />
      <PickListExporter />
      <InventoryAdjustWizard />
    </div>
  );
}
