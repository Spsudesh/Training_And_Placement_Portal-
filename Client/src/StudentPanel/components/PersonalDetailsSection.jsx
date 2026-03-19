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
const countryOptions = ["India"];

function PersonalDetailsSection({
  data,
  onFieldChange,
  onLocationChange,
  onFileChange,
  onSave,
  isSaved,
  locationData,
}) {
  const {
    states,
    districts,
    cities,
    loadingStates,
    loadingDistricts,
    loadingCities,
    error,
  } = locationData;

  const stateOptions = states.map((state) => ({
    value: String(state.id),
    label: state.name,
  }));

  const districtOptions = districts.map((district) => ({
    value: String(district.id),
    label: district.name,
  }));

  const cityOptions = cities.map((city) => ({
    value: String(city.id),
    label: city.name,
  }));

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
        label="Email"
        name="email"
        type="email"
        value={data.email}
        onChange={onFieldChange}
        placeholder="student@example.com"
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
      />

      <FieldGrid columns={4}>
        <SelectInput
          label="State"
          name="stateId"
          value={data.stateId}
          onChange={onLocationChange}
          options={stateOptions}
          placeholder={loadingStates ? "Loading states..." : "Select state"}
          disabled={loadingStates}
        />
        <SelectInput
          label="Country"
          name="country"
          value={data.country}
          onChange={onFieldChange}
          options={countryOptions}
          placeholder="Select country"
        />
        <SelectInput
          label="District"
          name="districtId"
          value={data.districtId}
          onChange={onLocationChange}
          options={districtOptions}
          disabled={!data.stateId || loadingDistricts}
          placeholder={
            !data.stateId
              ? "Choose state first"
              : loadingDistricts
              ? "Loading districts..."
              : "Select district"
          }
        />
        <SelectInput
          label="City"
          name="cityId"
          value={data.cityId}
          onChange={onLocationChange}
          options={cityOptions}
          disabled={!data.districtId || loadingCities}
          placeholder={
            !data.districtId
              ? "Choose district first"
              : loadingCities
              ? "Loading cities..."
              : "Select city"
          }
        />
      </FieldGrid>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <TextInput
        label="Pincode"
        name="pincode"
        value={data.pincode}
        onChange={onFieldChange}
        placeholder="Pincode"
      />

      <FieldGrid columns={2}>
        <TextInput label="Date of Birth" name="dob" type="date" value={data.dob} onChange={onFieldChange} />
        <TextInput
          label="Age"
          name="age"
          type="number"
          value={data.age}
          onChange={onFieldChange}
          placeholder="Age"
        />
      </FieldGrid>

      <FieldGrid columns={3}>
        <SelectInput label="Gender" name="gender" value={data.gender} onChange={onFieldChange} options={genderOptions} />
        <SelectInput
          label="Category"
          name="category"
          value={data.category}
          onChange={onFieldChange}
          options={categoryOptions}
        />
        <SelectInput
          label="Handicap"
          name="handicap"
          value={data.handicap}
          onChange={onFieldChange}
          options={handicapOptions}
        />
      </FieldGrid>

      <TextInput
        label="Aadhaar Number"
        name="aadhaar"
        value={data.aadhaar}
        onChange={onFieldChange}
        placeholder="XXXX XXXX XXXX"
      />

      <div className="space-y-4">
        <UploadRow
          label="Profile Photo"
          name="profilePhoto"
          fileName={data.profilePhoto}
          onChange={onFileChange}
          accept=".jpg,.jpeg,.png"
          helperText="Upload passport-size photograph"
        />
      </div>
    </SectionCard>
  );
}

export default PersonalDetailsSection;
