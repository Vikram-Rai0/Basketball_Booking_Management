import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "./shared/Navbar";
import Footer from "./shared/Footert";
import {
  ShieldCheck,
  Trophy,
  Clock,
  Zap,
  Users,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  CheckCircle,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

/* ------------------ IMAGES ------------------ */
const HERO =
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2400&auto=format&fit=crop";

const COURT =
  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2000&auto=format&fit=crop";

const TOURNAMENT =
  "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?q=80&w=2000&auto=format&fit=crop";

const GALLERY = [
  "https://images.unsplash.com/photo-1544919978-87f9206b9e3b",
  "https://images.unsplash.com/photo-1519766304552-ccef3b4486bb",
  "https://images.unsplash.com/photo-1505666287802-931dc83948e9",
  "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4",
  "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b",
];

/* ------------------ COMPONENTS ------------------ */
const Stat = ({ value, label, delay = 0 }) => (
  <div
    className="text-center transform transition-all duration-500 hover:scale-110"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
      {value}
    </div>
    <div className="text-sm md:text-base text-gray-300 font-medium uppercase tracking-wide">
      {label}
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay = 0 }) => (
  <div
    className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-500 transition-colors duration-300">
      <Icon className="text-orange-500 group-hover:text-white transition-colors duration-300" size={28} />
    </div>
    <h3 className="font-bold text-lg mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

const ProcessStep = ({ number, title, desc, delay = 0 }) => (
  <div
    className="relative bg-white rounded-2xl p-8 text-center border border-gray-100 hover:shadow-lg transition-all duration-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
      {number}
    </div>
    <h4 className="font-bold text-lg mb-3 text-gray-900">{title}</h4>
    <p className="text-gray-600 leading-relaxed">{desc}</p>

    {/* Connection line for desktop */}
    {number !== "04" && (
      <div className="hidden md:block absolute top-12 -right-12 w-24 h-0.5 bg-gradient-to-r from-orange-300 to-transparent" />
    )}
  </div>
);

const TournamentCard = ({ delay = 0 }) => (
  <div
    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative overflow-hidden group">
      <img
        src={TOURNAMENT}
        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110"
        alt="Tournament"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
          UPCOMING
        </span>
        <span className="text-sm text-gray-500">Feb 15, 2026</span>
      </div>
      <h3 className="font-bold text-xl mb-2 text-gray-900">Summer Slam Tournament</h3>
      <p className="text-gray-600 mb-4">5v5 • Open Division • Prize Pool</p>
      <button
        onClick={() => { window.location.href = '/services'; }}
        className="group flex items-center gap-2 text-orange-500 font-semibold hover:gap-3 transition-all duration-300">
        Register Now
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

/* ------------------ MAIN PAGE ------------------ */
const HomePage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your form submission logic here
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleBookNow = () => {
    navigate('/services');
  };

  const scrollToGallery = () => {
    const gallery = document.getElementById('gallery');
    if (gallery) {
      gallery.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-20 overflow-hidden">
        <div
          className="h-[600px] md:h-[700px] bg-cover bg-center relative"
          style={{ backgroundImage: `url(${HERO})` }}
        >
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-600 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          {/* Content */}
          <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8 animate-fade-in">
                <CheckCircle className="text-orange-400" size={20} />
                <span className="text-white font-medium">Premium Basketball Facilities</span>
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-slide-up">
                Book Your Court,
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Play Your Game
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto animate-slide-up-delay">
                Professional-grade basketball courts with state-of-the-art facilities and flexible booking
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-delay">
                <button
                  onClick={handleBookNow}
                  className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Book Your Court Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                  onClick={scrollToGallery}>
                  <PlayCircle size={20} />
                  Watch Tour
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-3xl mx-auto">
                <Stat value="24/7" label="Access" delay={100} />
                <Stat value="$30" label="Per Hour" delay={200} />
                <Stat value="5000+" label="Players" delay={300} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-block mb-4">
                <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">
                  Why Choose Us
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                Premium Basketball Court for{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Serious Players
                </span>
              </h2>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Experience basketball at its finest with our professional hardwood floors,
                FIBA-standard equipment, and meticulously maintained facilities. Whether you're
                training for competition or playing for fun, our courts provide the perfect environment.
              </p>

              {/* Feature list */}
              <div className="space-y-4 mb-10">
                {[
                  'Professional hardwood flooring',
                  'FIBA-standard equipment',
                  'Climate-controlled environment',
                  'Premium lighting system'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="text-orange-500" size={16} />
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-orange-500 mb-1">94%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-500 mb-1">50+</div>
                  <div className="text-sm text-gray-600">Events Hosted</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-500 mb-1">10+</div>
                  <div className="text-sm text-gray-600">Premium Courts</div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={COURT}
                  className="w-full h-full object-cover"
                  alt="Basketball Court"
                />
                {/* Floating badge */}
                <div className="absolute bottom-6 right-6 bg-white rounded-2xl px-6 py-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="text-orange-500" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">5000+</div>
                      <div className="text-sm text-gray-600">Happy Players</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-orange-500/10 rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">
              Our Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Our Court
              </span>
            </h2>
            <p className="text-lg text-gray-600">
              Experience the best basketball facilities with features designed for both casual and competitive players
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={ShieldCheck}
              title="Safe & Secure Facility"
              desc="24/7 security monitoring, clean locker rooms, and well-maintained premises for your peace of mind"
              delay={0}
            />
            <FeatureCard
              icon={Trophy}
              title="Professional Equipment"
              desc="Competition-grade hoops, premium basketballs, and FIBA-standard court dimensions"
              delay={100}
            />
            <FeatureCard
              icon={Zap}
              title="Perfect Lighting"
              desc="Shadow-free LED lighting system designed specifically for optimal basketball playing conditions"
              delay={200}
            />
            <FeatureCard
              icon={Users}
              title="Active Community"
              desc="Join leagues, tournaments, and pick-up games with a vibrant community of basketball enthusiasts"
              delay={300}
            />
            <FeatureCard
              icon={Clock}
              title="Flexible Booking"
              desc="Easy online scheduling with real-time availability, instant confirmation, and 24/7 access"
              delay={400}
            />
            <FeatureCard
              icon={Star}
              title="Top Rated"
              desc="Consistently rated 5 stars by our players for quality, service, and overall experience"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Book your court in just a few simple steps and start playing within minutes
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <ProcessStep
              number="01"
              title="Choose Your Slot"
              desc="Browse available time slots and select the one that fits your schedule perfectly"
              delay={0}
            />
            <ProcessStep
              number="02"
              title="Complete Booking"
              desc="Fill in your details and confirm your booking with our secure payment system"
              delay={100}
            />
            <ProcessStep
              number="03"
              title="Get Confirmation"
              desc="Receive instant confirmation via email with your booking details and QR code"
              delay={200}
            />
            <ProcessStep
              number="04"
              title="Play Basketball"
              desc="Show up at your scheduled time and enjoy your game on our premium courts"
              delay={300}
            />
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button
              onClick={handleBookNow}
              className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
            >
              Start Booking Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= TOURNAMENTS ================= */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">
              Compete & Win
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
              Upcoming Tournaments
            </h2>
            <p className="text-lg text-gray-600">
              Join our competitive tournaments and showcase your skills against the best players
            </p>
          </div>

          {/* Tournament Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TournamentCard delay={0} />
            <TournamentCard delay={100} />
            <TournamentCard delay={200} />
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIAL ================= */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Stars */}
          <div className="flex justify-center gap-2 text-orange-400 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} fill="currentColor" size={28} />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed mb-8">
            "Absolutely the best basketball court experience in the city. Professional facilities,
            great community, and seamless booking process. Highly recommended!"
          </blockquote>

          {/* Author */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl font-bold">
              MJ
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">Michael Jordan</div>
              <div className="text-gray-400">National Level Player</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section id="gallery" className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">
              Our Facilities
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
              Explore Our Courts
            </h2>
            <p className="text-lg text-gray-600">
              Take a look at our state-of-the-art facilities and premium basketball courts
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY.map((img, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer"
              >
                <img
                  src={`${img}?q=80&w=1200`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={`Court ${i + 1}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <div className="inline-block mb-4">
                <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">
                  Contact Us
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Get In Touch
              </h2>

              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                Have questions about our facilities or need help with booking?
                We're here to help. Reach out to us and we'll get back to you as soon as possible.
              </p>

              {/* Contact Details */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Location</div>
                    <div className="text-gray-600">Kathmandu, Nepal</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Phone</div>
                    <div className="text-gray-600">+977 98XXXXXXXX</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Email</div>
                    <div className="text-gray-600">info@courtbook.com</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="bg-gray-50 p-8 md:p-10 rounded-2xl border border-gray-200">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows="5"
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.3s both;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-slide-up-delay {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  );
};

export default HomePage;