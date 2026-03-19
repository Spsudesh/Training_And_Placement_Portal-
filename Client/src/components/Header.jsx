import logo from "/rit_logo.jpeg";

function Header() {
  return (
    <div>
      {/* Top Section */}
      <div className="bg-sky-200 flex justify-between items-center px-6 py-3">
        
        {/* Left */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="logo" className="w-20 H-20" />

          <div>
            <p className="text-sm">Kasegaon Education Society's</p>
            <h2 className="font-bold text-lg">
              RAJARAMBAPU INSTITUTE OF TECHNOLOGY
            </h2>
            <p className="text-xs">An Empowered Autonomous Institute</p>
          </div>
        </div>

        {/* Right */}
        <div className="text-right text-sm MR-4">
          <p>NAAC A+ Graded Autonomous Institute</p>
          <p>DTE Code: EN6214 | MSBTE Code: 1740</p>
        </div>
      </div>

      {/* Navbar */}
      <div className="bg-blue-900 text-white flex gap-6 px-6 py-3 text-sm">
        {/* <p>HOME</p>
        <p>ABOUT US</p>
        <p>ACADEMIC</p>
        <p>DEPARTMENTS</p> */}
      </div>
    </div>
  );
}

export default Header;