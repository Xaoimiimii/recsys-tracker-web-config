import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './AuthPage.module.css';

interface AuthPageProps {
  onLogin: (e: React.FormEvent) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUp) {
      onLogin(e);
    } else {
      // Handle sign up logic here
      console.log('Sign up submitted');
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={`${styles.card} ${isSignUp ? styles.signUpMode : ''}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Illustration Side */}
        <motion.div 
          className={styles.illustrationSide}
          layout
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >          
          <motion.div 
            className={styles.illustrationContent}
            key={isSignUp ? 'signup-illustration' : 'signin-illustration'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles.imageContainer}>
              <img src="/images/auth_pic.svg" alt="RecoTrack" className={styles.authImage} />
            </div>
            <motion.h1 
              className={styles.brandTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className={styles.brandTitleReco}>Reco</span>
              <span className={styles.brandTitleTrack}>Track</span>
            </motion.h1>
            <motion.p 
              className={styles.brandSubtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Discover what your users truly want!
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Form Side */}
        <motion.div 
          className={styles.formSide}
          layout
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div 
            className={styles.formContent}
            key={isSignUp ? 'signup-form' : 'signin-form'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.h2 
              className={styles.formTitle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </motion.h2>
            <motion.p 
              className={styles.formSubtitle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {isSignUp 
                ? 'Fill in your details to get started' 
                : 'Enter your credentials to continue'}
            </motion.p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div 
                    className={styles.formGroup}
                    initial={{ opacity: 0, y: 15, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -15, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className={styles.label}>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className={styles.input} 
                      required 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className={styles.formGroup}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isSignUp ? 0.25 : 0.2 }}
              >
                <label className={styles.label}>Email</label>
                <input 
                  type="email" 
                  defaultValue={!isSignUp ? "demo@example.com" : ""} 
                  placeholder="your@email.com"
                  className={styles.input} 
                  required 
                />
              </motion.div>

              <motion.div 
                className={styles.formGroup}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isSignUp ? 0.3 : 0.25 }}
              >
                <label className={styles.label}>Password</label>
                <input 
                  type="password" 
                  defaultValue={!isSignUp ? "password" : ""} 
                  placeholder="••••••••"
                  className={styles.input} 
                  required 
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div 
                    className={styles.formGroup}
                    initial={{ opacity: 0, y: 15, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -15, height: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <label className={styles.label}>Confirm Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className={styles.input} 
                      required 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                type="submit" 
                className={styles.submitButton}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isSignUp ? 0.4 : 0.3 }}
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </motion.button>
            </form>

            <motion.p 
              className={styles.toggleText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: isSignUp ? 0.45 : 0.35 }}
            >
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)} 
                className={styles.toggleButton}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
