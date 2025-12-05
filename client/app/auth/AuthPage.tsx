import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './AuthPage.module.css';
import { useAuth } from "@/hooks/useAuth";

interface AuthPageProps {
  onLogin: (e: React.FormEvent) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signin, signup } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      if (!isSignUp) {
        await signin({ username, password });
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match!");
          return;
        }
        await signup({ username, password, name });
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setSuccessMessage('Account created successfully! Please sign in.');
        setTimeout(() => setIsSignUp(false), 2000);
      }
    } catch (error: any) {
      console.error("Auth error", error);
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred. Please try again.';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
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
                {error && (
                  <motion.div 
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {successMessage && isSignUp && (
                  <motion.div 
                    className={styles.successMessage}
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className={styles.successIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>
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
                      onChange={(e) => setName(e.target.value)}
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
                <label className={styles.label}>Username</label>
                <input 
                  type="text" 
                  defaultValue={!isSignUp ? "" : ""} 
                  placeholder="Enter your username"
                  className={styles.input} 
                  required 
                  onChange={(e) => setUsername(e.target.value)}
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
                  defaultValue={!isSignUp ? "" : ""} 
                  placeholder="••••••••"
                  className={styles.input} 
                  required 
                  onChange={(e) => setPassword(e.target.value)}
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
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
