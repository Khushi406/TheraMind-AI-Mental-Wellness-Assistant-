import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <i className="fas fa-brain text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-bold text-neutral-800">TheraMind</h2>
              </div>
            </Link>
            <p className="text-neutral-600 text-sm mt-1">Your emotional wellness companion</p>
          </div>
          
          <div className="flex space-x-4">
            <button className="text-neutral-600 hover:text-primary transition-colors">
              <i className="fas fa-shield-alt mr-1"></i> Privacy
            </button>
            <button className="text-neutral-600 hover:text-primary transition-colors">
              <i className="fas fa-question-circle mr-1"></i> Help
            </button>
            <button className="text-neutral-600 hover:text-primary transition-colors">
              <i className="fas fa-file-alt mr-1"></i> Terms
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-200 text-center text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} TheraMind. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
