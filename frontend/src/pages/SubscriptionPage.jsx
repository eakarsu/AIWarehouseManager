import React, { useState, useEffect } from 'react';
import { CreditCard, Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const planIcons = {
  free: Sparkles,
  pro: Zap,
  enterprise: Crown
};

const planColors = {
  free: 'from-gray-500 to-gray-600',
  pro: 'from-primary-500 to-secondary-500',
  enterprise: 'from-amber-500 to-orange-500'
};

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [plansRes, subRes] = await Promise.all([
          api.getSubscriptionPlans(),
          api.getCurrentSubscription().catch(() => ({ data: null }))
        ]);
        setPlans(plansRes.data.plans || plansRes.data || []);
        setCurrentSub(subRes.data?.subscription || subRes.data);
      } catch (err) {
        toast.error('Failed to load subscription info');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      const res = await api.subscribe(planId);
      setCurrentSub(res.data.subscription || res.data);
      toast.success('Subscription updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      await api.cancelSubscription();
      setCurrentSub({ ...currentSub, status: 'cancelled', plan: 'free' });
      toast.success('Subscription cancelled');
    } catch (err) {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const isCurrentPlan = (plan) => {
    const planName = plan.name?.toLowerCase() || plan.id?.toLowerCase() || '';
    const currentPlan = currentSub?.plan?.toLowerCase() || currentSub?.planName?.toLowerCase() || 'free';
    return planName === currentPlan || plan.id === currentSub?.planId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Default plans if none loaded
  const displayPlans = plans.length > 0 ? plans : [
    {
      id: 'free', name: 'Free', price: 0,
      features: ['5 designs', '3 AI generations/month', 'Basic styles', 'Community support'],
      credits: 3
    },
    {
      id: 'pro', name: 'Pro', price: 19.99,
      features: ['Unlimited designs', '50 AI generations/month', 'All styles', 'AR experience', 'PDF export', 'Priority support'],
      credits: 50, popular: true
    },
    {
      id: 'enterprise', name: 'Enterprise', price: 49.99,
      features: ['Everything in Pro', 'Unlimited AI generations', 'Custom styles', 'API access', 'Team collaboration', 'Dedicated support'],
      credits: -1
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Subscription Plans</h1>
        <p className="text-gray-600">Choose the plan that fits your design needs</p>
      </div>

      {/* Current Plan Info */}
      {currentSub && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Subscription</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Plan</p>
              <p className="font-bold text-gray-800 capitalize">{currentSub.plan || currentSub.planName || 'Free'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                currentSub.status === 'active' ? 'bg-green-100 text-green-700' :
                currentSub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {currentSub.status || 'Active'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Credits Used</p>
              <p className="font-bold text-gray-800">
                {currentSub.creditsUsed ?? 0} / {currentSub.creditsTotal === -1 ? 'Unlimited' : (currentSub.creditsTotal ?? 0)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Credits Remaining</p>
              <p className="font-bold text-primary-600">
                {currentSub.creditsTotal === -1 ? 'Unlimited' : Math.max(0, (currentSub.creditsTotal ?? 0) - (currentSub.creditsUsed ?? 0))}
              </p>
            </div>
          </div>

          {/* Credits progress bar */}
          {currentSub.creditsTotal > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((currentSub.creditsUsed || 0) / currentSub.creditsTotal) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(((currentSub.creditsUsed || 0) / currentSub.creditsTotal) * 100)}% used this period
              </p>
            </div>
          )}

          {currentSub.renewDate && (
            <p className="text-xs text-gray-500 mt-3">
              Renews on {new Date(currentSub.renewDate).toLocaleDateString()}
            </p>
          )}

          {currentSub.status === 'active' && currentSub.plan !== 'free' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-4 text-red-600 text-sm font-medium hover:text-red-700 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {displayPlans.map((plan) => {
          const planKey = plan.name?.toLowerCase() || plan.id?.toLowerCase() || '';
          const Icon = planIcons[planKey] || Sparkles;
          const gradient = planColors[planKey] || 'from-gray-500 to-gray-600';
          const isCurrent = isCurrentPlan(plan);

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition relative ${
                plan.popular ? 'border-primary-300 shadow-md' : 'border-gray-100'
              } ${isCurrent ? 'ring-2 ring-primary-500' : ''}`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-center py-1 text-xs font-medium">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-gray-800">
                    ${plan.price?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                )}

                <ul className="space-y-3 mb-6">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{typeof feature === 'string' ? feature : feature.name}</span>
                    </li>
                  ))}
                </ul>

                {plan.credits !== undefined && (
                  <p className="text-xs text-gray-500 mb-4">
                    {plan.credits === -1 ? 'Unlimited' : plan.credits} AI credits/month
                  </p>
                )}

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing}
                    className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:opacity-90'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subscribing ? 'Processing...' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;
