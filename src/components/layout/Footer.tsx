import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-12">
        {/* Popular Categories Section */}
        <div className="mb-12 pb-8 border-b border-primary-foreground/10">
          <h3 className="text-base font-semibold mb-3">Popular Categories</h3>
          <div className="flex flex-wrap gap-2">
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">CRM Solutions</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Project Management</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Accounting Software</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">HRM Tools</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Marketing Automation</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Analytics Platforms</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">E-Commerce Solutions</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Communication Tools</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Collaboration Platforms</a>
            <span className="opacity-30">|</span>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Cybersecurity Software</a>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4 text-sm">Discover</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Home</Link></li>
              <li><a href="#categories" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Categories</a></li>
              <li><a href="#offers" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Trending Offers</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Latest Products</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Free Trial</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Pricing Plans</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Compare Tools</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Webinars</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Blog</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Case Studies</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Documentation</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Help & Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Contact Us</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">FAQs</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Support Ticket</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Live Chat</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">About Us</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Terms of Service</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Careers</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-bold">Book Demo</span>
          </div>
          <p className="text-sm opacity-50">© {new Date().getFullYear()} Book Demo. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Twitter</a>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">LinkedIn</a>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
