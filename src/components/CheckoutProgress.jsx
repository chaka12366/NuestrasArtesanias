import { Fragment } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import "./CheckoutProgress.css";

export default function CheckoutProgress({
  currentStep = 1,
  totalSteps = 3,
  steps = ["Account", "Delivery", "Review"],
  descriptions = []
}) {

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="checkout-progress" role="region" aria-label="Checkout progress">
      {}
      <div className="checkout-progress-counter">
        <span className="counter-current">{currentStep}</span>
        <span className="counter-separator">of</span>
        <span className="counter-total">{totalSteps}</span>
      </div>

      {}
      <div className="checkout-progress-bar-container">
        {}
        <div className="checkout-progress-bar-track" aria-hidden="true" />

        {}
        <motion.div
          className="checkout-progress-bar-fill"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1]
          }}
          aria-hidden="true"
        />
      </div>

      {}
      <div className="checkout-progress-steps">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <Fragment key={stepNumber}>
              {}
              <div
                className={`checkout-progress-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin="1"
                aria-valuemax={totalSteps}
                aria-label={`${label}${isCompleted ? " - completed" : isActive ? " - current" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {}
                <motion.div
                  className="checkout-progress-dot"
                  animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <span className="dot-number">{stepNumber}</span>
                  )}
                </motion.div>

                {}
                <div className="checkout-progress-label-group">
                  <span className="checkout-progress-label">{label}</span>
                  {descriptions[index] && (
                    <span className="checkout-progress-description">
                      {descriptions[index]}
                    </span>
                  )}
                </div>
              </div>

              {}
              {index < steps.length - 1 && (
                <div className="checkout-progress-connector-wrap">
                  <div className="checkout-progress-connector-base" aria-hidden="true" />
                  {isCompleted && (
                    <motion.div
                      className="checkout-progress-connector-fill"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                        delay: 0.1
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {}
      <div className="checkout-progress-mobile-summary">
        <span className="mobile-summary-text">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="mobile-summary-label">{steps[currentStep - 1]}</span>
      </div>
    </div>
  );
}
