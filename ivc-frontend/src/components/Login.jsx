import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const lockoutTimerRef = useRef(null);
  
  const navigate = useNavigate();

  // Sanitize input to prevent XSS
  const sanitizeInput = (input) => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove < and > characters
      .slice(0, 255); // Limit length
  };

  // Rate limiting - lock after 5 failed attempts
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  const handleLockout = () => {
    setIsLocked(true);
    setError(`Too many failed attempts. Please try again in 15 minutes.`);
    
    // Clear existing timer if any
    if (lockoutTimerRef.current) {
      clearTimeout(lockoutTimerRef.current);
    }
    
    // Set timer to unlock
    lockoutTimerRef.current = setTimeout(() => {
      setIsLocked(false);
      setLoginAttempts(0);
      setError(null);
    }, LOCKOUT_TIME);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if locked out
    if (isLocked) {
      setError("Account temporarily locked. Please try again later.");
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password.slice(0, 255); // Limit password length but don't sanitize special chars

    // Basic validation
    if (!sanitizedEmail || !sanitizedPassword) {
      setError("Please provide both email and password");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword
      });

      if (error) throw error;

      // Success - reset attempts
      setLoginAttempts(0);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/home"), 1500);
      setEmail("");
      setPassword("");
    } catch (err) {
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        handleLockout();
      } else {
        setError(
          `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setTimeout(() => navigate("/home"), 1000); //TODO: CHANGE ME LATER
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Cleanup timer on unmount
  useState(() => {
    return () => {
      if (lockoutTimerRef.current) {
        clearTimeout(lockoutTimerRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <img
          src="/src/assets/t"
          alt="I-Vision Corp Logo"
          style={styles.image}
        />
        
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
            disabled={isLocked || isLoading}
            autoComplete="email"
            maxLength={255}
          />
          
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.passwordInput}
              required
              disabled={isLocked || isLoading}
              autoComplete="current-password"
              maxLength={255}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={styles.eyeButton}
              disabled={isLocked || isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </button>
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(isLocked || isLoading ? styles.buttonDisabled : {})
            }}
            disabled={isLocked || isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p style={{ marginTop: "10px" }}>
          <button
            onClick={handleForgotPassword}
            style={styles.forgotPassword}
            disabled={isLoading}
          >
            Forgot Password?
          </button>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  formWrapper: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  image: {
    width: "160px",
    height: "60px",
    margin: "15px auto",
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    maxWidth: '300px',
    padding: '10px',
    margin: '8px 0',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '300px',
    margin: '8px 0',
  },
  passwordInput: {
    width: '100%',
    padding: '10px',
    paddingRight: '40px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '150px',
    padding: '10px',
    marginTop: '10px',
    borderRadius: '4px',
    border: 'none',
    color: '#fff',
    backgroundColor: '#1a1a1a',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#999',
    cursor: 'not-allowed',
  },
  forgotPassword: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  },
  success: {
    color: 'green',
    fontSize: '14px',
    marginBottom: '10px',
  },
};

export default Login;