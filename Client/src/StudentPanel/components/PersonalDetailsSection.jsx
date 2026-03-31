import {
  FieldGrid,
  SaveButton,
  SectionCard,
  SelectInput,
  TextInput,
  UploadRow,
} from "./FormUI";

const genderOptions = ["Male", "Female", "Other"];
const categoryOptions = ["Open", "OBC", "SC", "ST", "EWS", "NT", "SBC"];
const handicapOptions = ["No", "Yes"];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function PersonalDetailsSection({
  data,
  onFieldChange,
  onFileChange,
  onSave,
  isSaved,
}) {
  return (
    <SectionCard
      title="Personal Details"
      description="Fill in your primary identity, contact, and address details exactly as per official records."
      actions={<SaveButton onClick={onSave} saved={isSaved} />}
    >
      <TextInput
        label="PRN"
        name="prn"
        value={data.prn}
        onChange={onFieldChange}
        placeholder="Enter PRN number"
        required
      />

      <FieldGrid columns={3}>
        <TextInput
          label="First Name"
          name="firstName"
          value={data.firstName}
          onChange={onFieldChange}
          placeholder="First name"
          required
        />
        <TextInput
          label="Middle Name"
          name="middleName"
          value={data.middleName}
          onChange={onFieldChange}
          placeholder="Middle name"
          required
        />
        <TextInput
          label="Last Name"
          name="lastName"
          value={data.lastName}
          onChange={onFieldChange}
          placeholder="Last name"
          required
        />
      </FieldGrid>

      <TextInput
        label="Personal Email"
        name="email"
        type="email"
        value={data.email}
        onChange={onFieldChange}
        placeholder="Enter your personal email"
        required
      />

      <TextInput
        label="College Email"
        name="collegeEmail"
        type="email"
        value={data.collegeEmail}
        onChange={onFieldChange}
        placeholder="yourname@ritindia.edu"
        disabled
        required
      />

      <TextInput
        label="Mobile Number"
        name="mobile"
        value={data.mobile}
        onChange={onFieldChange}
        placeholder="10 digit mobile number"
        required
      />

      <TextInput
        label="Address"
        name="address"
        value={data.address}
        onChange={onFieldChange}
        placeholder="Flat / House number, street, locality"
        required
      />

      <FieldGrid columns={4}>
        <TextInput
          label="Country"
          name="country"
          value={data.country}
          onChange={onFieldChange}
          placeholder="Country"
          required
        />
        <TextInput
          label="State"
          name="state"
          value={data.state}
          onChange={onFieldChange}
          placeholder="State"
          required
        />
        <TextInput
          label="District"
          name="district"
          value={data.district}
          onChange={onFieldChange}
          placeholder="District"
          required
        />
        <TextInput
          label="City"
          name="city"
          value={data.city}
          onChange={onFieldChange}
          placeholder="City"
          required
        />
      </FieldGrid>

      <TextInput
        label="Pincode"
        name="pincode"
        value={data.pincode}
        onChange={onFieldChange}
        placeholder="Pincode"
        required
      />

      <FieldGrid columns={3}>
        <TextInput label="Date of Birth" name="dob" type="date" value={data.dob} onChange={onFieldChange} required />
        <TextInput
          label="Age"
          name="age"
          type="number"
          value={data.age}
          onChange={onFieldChange}
          placeholder="Age"
          disabled
          hint="Age is calculated automatically from Date of Birth."
        />
        <SelectInput
          label="Blood Group"
          name="bloodGroup"
          value={data.bloodGroup}
          onChange={onFieldChange}
          options={bloodGroupOptions}
          required
        />
      </FieldGrid>

      <FieldGrid columns={3}>
        <SelectInput label="Gender" name="gender" value={data.gender} onChange={onFieldChange} options={genderOptions} required />
        <SelectInput
          label="Category"
          name="category"
          value={data.category}
          onChange={onFieldChange}
          options={categoryOptions}
          required
        />
        <SelectInput
          label="Handicap"
          name="handicap"
          value={data.handicap}
          onChange={onFieldChange}
          options={handicapOptions}
          required
        />
      </FieldGrid>

      <TextInput
        label="Aadhaar Number"
        name="aadhaar"
        value={data.aadhaar}
        onChange={onFieldChange}
        placeholder="XXXX XXXX XXXX"
        required
      />

      <TextInput
        label="PAN Number"
        name="panNumber"
        value={data.panNumber}
        onChange={onFieldChange}
        placeholder="ABCDE1234F"
        required
      />

      <div className="space-y-4">
        <UploadRow
          label="Profile Photo"
          name="profilePhoto"
          fileName={data.profilePhoto}
          onChange={onFileChange}
          accept=".jpg,.jpeg,.png"
          helperText="Upload passport-size photograph"
          required
        />
      </div>
    </SectionCard>
  );
}

export default PersonalDetailsSection;
