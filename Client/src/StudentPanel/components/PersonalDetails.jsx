import { useState } from "react";

function PersonalDetails({ onSave }) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Personal Details
      </h2>

      {/* Name Row */}
      <div className="flex gap-3 mb-3">
        <input
          name="firstName"
          placeholder="First Name"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          name="middleName"
          placeholder="Middle Name"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          name="lastName"
          placeholder="Last Name"
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>

      {/* Email */}
      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      {/* Save */}
      <button
        onClick={onSave}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save & Continue
      </button>
    </div>
  );
}

export default PersonalDetails;