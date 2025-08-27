import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { AnimatedWrapper, StaggeredList, AnimatedPresenceWrapper } from '../components/common/AnimatedWrapper';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { InteractiveButton, PrimaryButton, SecondaryButton, DangerButton } from '../components/common/InteractiveButton';
import { NotificationProvider, useNotificationHelpers } from '../components/common/NotificationSystem';
import { FormField } from '../components/common/FormField';
import { 
  fadeInUp, 
  fadeIn, 
  scaleIn, 
  slideInFromRight, 
  slideInFromLeft,
  hoverLift,
  hoverScale,
  statusChangeVariants,
  pulseVariants
} from '../utils/animations';

const AnimationDemoContent: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showCards, setShowCards] = useState(true);
  const [formValue, setFormValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useNotificationHelpers();

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Loading Complete', 'The operation finished successfully!');
    }, 3000);
  };

  const cardData = [
    { id: 1, title: 'Card 1', description: 'This is the first animated card' },
    { id: 2, title: 'Card 2', description: 'This is the second animated card' },
    { id: 3, title: 'Card 3', description: 'This is the third animated card' },
    { id: 4, title: 'Card 4', description: 'This is the fourth animated card' },
  ];

  return (
    <Layout title="Animation Demo">
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Page Transitions */}
        <AnimatedWrapper animation="fadeInUp">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Transitions</h2>
            <p className="text-gray-600 mb-4">
              This page demonstrates smooth page transitions using Framer Motion.
            </p>
          </div>
        </AnimatedWrapper>

        {/* Loading Animations */}
        <AnimatedWrapper animation="fadeInUp" delay={0.1}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Loading Animations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Spinner</h4>
                <LoadingSpinner variant="spinner" size="lg" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Dots</h4>
                <LoadingSpinner variant="dots" size="lg" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Pulse</h4>
                <LoadingSpinner variant="pulse" size="lg" />
              </div>
            </div>
            <div className="mt-6">
              <PrimaryButton 
                onClick={handleLoadingDemo}
                loading={loading}
                animation="bounce"
              >
                {loading ? 'Loading...' : 'Test Loading State'}
              </PrimaryButton>
            </div>
          </div>
        </AnimatedWrapper>

        {/* Interactive Buttons */}
        <AnimatedWrapper animation="fadeInUp" delay={0.2}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Interactive Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <PrimaryButton animation="scale">Scale Animation</PrimaryButton>
              <SecondaryButton animation="lift">Lift Animation</SecondaryButton>
              <DangerButton animation="bounce">Bounce Animation</DangerButton>
              <InteractiveButton variant="ghost" animation="pulse">
                Pulse Animation
              </InteractiveButton>
            </div>
          </div>
        </AnimatedWrapper>

        {/* Hover Effects */}
        <AnimatedWrapper animation="fadeInUp" delay={0.3}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Hover Effects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                className="bg-blue-50 rounded-lg p-4 cursor-pointer"
                {...hoverLift}
              >
                <h4 className="font-medium text-blue-900">Hover Lift Effect</h4>
                <p className="text-blue-700 text-sm">Hover over this card to see the lift animation</p>
              </motion.div>
              <motion.div 
                className="bg-green-50 rounded-lg p-4 cursor-pointer"
                {...hoverScale}
              >
                <h4 className="font-medium text-green-900">Hover Scale Effect</h4>
                <p className="text-green-700 text-sm">Hover over this card to see the scale animation</p>
              </motion.div>
            </div>
          </div>
        </AnimatedWrapper>

        {/* Staggered Animations */}
        <AnimatedWrapper animation="fadeInUp" delay={0.4}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Staggered Animations</h3>
            <div className="mb-4">
              <button
                onClick={() => setShowCards(!showCards)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {showCards ? 'Hide Cards' : 'Show Cards'}
              </button>
            </div>
            <AnimatePresence>
              {showCards && (
                <StaggeredList className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cardData.map((card) => (
                    <motion.div
                      key={card.id}
                      className="bg-gray-50 rounded-lg p-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <h4 className="font-medium text-gray-900">{card.title}</h4>
                      <p className="text-gray-600 text-sm">{card.description}</p>
                    </motion.div>
                  ))}
                </StaggeredList>
              )}
            </AnimatePresence>
          </div>
        </AnimatedWrapper>

        {/* Form Animations */}
        <AnimatedWrapper animation="fadeInUp" delay={0.5}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Form Field Animations</h3>
            <div className="max-w-md">
              <FormField
                label="Animated Input"
                name="demo-input"
                type="text"
                value={formValue}
                onChange={setFormValue}
                placeholder="Type something to see focus animation"
                validation={{ required: true, minLength: 3 }}
                helpText="This field has focus animations and validation"
              />
            </div>
          </div>
        </AnimatedWrapper>

        {/* Status Change Animation */}
        <AnimatedWrapper animation="fadeInUp" delay={0.6}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Status Change Animation</h3>
            <motion.div 
              className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 cursor-pointer"
              variants={statusChangeVariants}
              whileHover="animate"
            >
              <h4 className="font-medium text-yellow-900">Click to see status change animation</h4>
              <p className="text-yellow-700 text-sm">This simulates a task status change</p>
            </motion.div>
          </div>
        </AnimatedWrapper>

        {/* Modal Animation */}
        <AnimatedWrapper animation="fadeInUp" delay={0.7}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Modal Animations</h3>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Open Animated Modal
            </button>
          </div>
        </AnimatedWrapper>

        {/* Notification Demos */}
        <AnimatedWrapper animation="fadeInUp" delay={0.8}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Notification Animations</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => showSuccess('Success!', 'This is a success notification')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Show Success
              </button>
              <button
                onClick={() => showError('Error!', 'This is an error notification')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Show Error
              </button>
              <button
                onClick={() => showWarning('Warning!', 'This is a warning notification')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Show Warning
              </button>
              <button
                onClick={() => showInfo('Info!', 'This is an info notification')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Show Info
              </button>
            </div>
          </div>
        </AnimatedWrapper>

        {/* Pulse Animation Demo */}
        <AnimatedWrapper animation="fadeInUp" delay={0.9}>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Continuous Animations</h3>
            <motion.div 
              className="w-16 h-16 bg-blue-600 rounded-full mx-auto"
              variants={pulseVariants}
              animate="animate"
            />
            <p className="text-center text-gray-600 mt-2">Pulsing animation</p>
          </div>
        </AnimatedWrapper>
      </motion.div>

      {/* Animated Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Animated Modal</h3>
              <p className="text-gray-600 mb-6">
                This modal appears with smooth scale and fade animations.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export const AnimationDemo: React.FC = () => {
  return (
    <NotificationProvider>
      <AnimationDemoContent />
    </NotificationProvider>
  );
};