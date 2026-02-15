const Footer = () => {
  return (
    <footer className="bg-orange-500 text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10 text-sm">
        <div>
          <h3 className="font-bold text-lg mb-3">CourtBook</h3>
          <p className="opacity-80">
            Premium basketball court booking platform.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 opacity-90">
            <li>Home</li>
            <li>About</li>
            <li>Gallery</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Services</h4>
          <ul className="space-y-2 opacity-90">
            <li>Court Booking</li>
            <li>Tournaments</li>
            <li>Training</li>
            <li>Events</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="opacity-90">Kathmandu, Nepal</p>
          <p className="opacity-90">info@courtbook.com</p>
        </div>
      </div>

      <div className="text-center text-xs opacity-80 pb-6">
        © 2026 CourtBook. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
