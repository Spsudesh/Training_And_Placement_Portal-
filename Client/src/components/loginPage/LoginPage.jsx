import React from "react";

function LoginPage() {
  return (
<div className="min-h-screen flex flex-col items-center mt-[100px] text-center font-sans ">    
    <p className="text-xs">K. E. Societys</p>

      <h2 className="text-[22px] text-[#1a2db6] mt-1">
        Rajarambapu Institute of Technology.
      </h2>

      <img
        src="/rit_logo.jpeg"
        alt="RIT Logo"
        className="w-[220px] my-2"
      />

      <h2 className="text-purple-700 mb-5">
        Training and Placement System
      </h2>

      <div className="w-[340px] bg-gray-200 rounded shadow-md">
        
        <div className="bg-gray-300 border-b border-gray-400 text-left pl-2 py-1">
          <p>Please Sign In</p>
        </div>

        <div className="p-3">
          
          <input
            type="text"
            placeholder="User Id"
            className="w-[90%] p-2.5 mb-3 border border-gray-300 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-[90%] p-2.5 mb-3 border border-gray-300 rounded"
          />

          <button className="w-[97%] p-2.5 bg-green-500 text-white text-base rounded hover:bg-green-600">
            Login
          </button>

          <p className="text-blue-600 text-xs mt-2 cursor-pointer">
            Forgot your password?
          </p>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;