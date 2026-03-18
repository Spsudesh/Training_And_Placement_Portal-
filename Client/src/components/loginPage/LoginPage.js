import React from "react";
import "./LoginPage.css";

function LoginPage() {
  return (
    <div className="main-container">
      
      <p className="top-text">K. E. Societys</p>

      <h2 className="college-name">
        Rajarambapu Institute of Technology.
      </h2>

      <img
        src="/rit_logo.jpeg"
        alt="RIT Logo"
        className="rit-logo"
      />

      <h2 className="ritage">Training and Placement System</h2>

      <div className="login-card">
        <div className="card-header">
          <p>Please Sign In</p>
        </div>
        <div className="card-body">

          <input
            type="text"
            placeholder="User Id"
            className="input-field"
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
          />

          <button className="login-btn">Login</button>

          <p className="forgot">Forgot your password?</p>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;