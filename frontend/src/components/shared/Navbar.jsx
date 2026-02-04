import { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Calendar, ChevronDown, User, LogOut } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "My Bookings", path: "/my-bookings" },
    { name: "About", path: "/#about" },
    { name: "Contact", path: "/#contact" },
  ];

  const isHomePage = location.pathname === "/";
  const isScrolledOrInterior = scrolled || !isHomePage;

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolledOrInterior
            ? " bg-white/95 backdrop-blur-lg shadow-lg "
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center gap-2 text-2xl font-extrabold transition-transform duration-300 hover:scale-105"
            >
              <div className="relative">
                <span
                  className={`transition-colors duration-300 ${
                    isScrolledOrInterior ? "text-gray-900" : "text-white"
                  }`}
                >
                  Court
                </span>
                <span className="text-orange-500">Book</span>

                {/* Underline animation */}
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-sm font-semibold transition-all duration-300 group ${
                    isScrolledOrInterior
                      ? "text-gray-700 hover:text-orange-500"
                      : "text-white hover:text-orange-400"
                  } ${
                    location.pathname === link.path
                      ? isScrolledOrInterior
                        ? "text-orange-500"
                        : "text-orange-400"
                      : ""
                  }`}
                >
                  {link.name}

                  {/* Active indicator */}
                  {location.pathname === link.path && (
                    <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
                  )}

                  {/* Hover underline */}
                  <div
                    className={`absolute -bottom-2 left-0 w-0 h-0.5 rounded-full group-hover:w-full transition-all duration-300 ${
                      isScrolledOrInterior ? "bg-orange-500" : "bg-orange-400"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span
                    className={`font-medium ${
                      isScrolledOrInterior ? "text-gray-700" : "text-white"
                    }`}
                  >
                    Hi, {user.full_name?.split(" ")[0]}
                  </span>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className={`p-2 rounded-full transition-colors ${
                      isScrolledOrInterior
                        ? "hover:bg-gray-100 text-gray-700"
                        : "hover:bg-white/10 text-white"
                    }`}
                    title="Dashboard"
                  >
                    <User size={20} />
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      isScrolledOrInterior
                        ? "hover:bg-gray-100 text-gray-700"
                        : "hover:bg-white/10 text-white"
                    }`}
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                  <button
                    onClick={() => navigate("/services")}
                    className={`group relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                      isScrolledOrInterior
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/50"
                        : "bg-white text-orange-500 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    <Calendar size={18} />
                    <span>Book Now</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    to="/login"
                    className={`font-semibold transition-colors ${
                      isScrolledOrInterior
                        ? "text-gray-700 hover:text-orange-500"
                        : "text-white hover:text-orange-400"
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                      isScrolledOrInterior
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20"
                    }`}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors duration-300 ${
                isScrolledOrInterior
                  ? "text-gray-900 hover:bg-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="text-xl font-extrabold">
              Court<span className="text-orange-500">Book</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Menu Links */}
          <div className="flex-1 overflow-y-auto py-6">
            <div className="px-6 space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                    location.pathname === link.path
                      ? "bg-orange-50 text-orange-500"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={{
                    animation: mobileMenuOpen
                      ? `slideIn 0.3s ease-out ${index * 0.05}s both`
                      : "none",
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Menu CTA */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            {/* Mobile Auth Buttons */}
            {user ? (
              <div className="space-y-3">
                <div className="px-4 py-2 text-gray-900 font-semibold border-b border-gray-100 mb-2">
                  Hi, {user.full_name}
                </div>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <User size={20} />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <LogOut size={20} />
                  Logout
                </button>
                <button
                  onClick={() => {
                    navigate("/services");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Book Your Court Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 text-gray-700 font-semibold hover:text-orange-500 border border-gray-200 rounded-xl"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800"
                >
                  Create Account
                </Link>
              </div>
            )}

            {!user && (
              <div className="text-center text-sm text-gray-500">
                Open 24/7 • $30/hour
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
