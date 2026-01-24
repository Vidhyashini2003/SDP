import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative h-[600px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/60 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Luxury Hotel"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent mb-6 tracking-wide"
                        style={{ textShadow: '0 0 40px rgba(59, 130, 246, 0.5)' }}
                    >
                        Janas Blue Water Corner
                    </motion.h1>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                    >
                        Experience Luxury <br /> Redefined
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-slate-200 mb-8 max-w-2xl"
                    >
                        Your perfect gateway awaits. Book rooms, activities, order foods and transport seamlessly.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex gap-4"
                    >
                        <Link to="/login" className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition-all transform hover:scale-105 shadow-lg">
                            Login
                        </Link>
                        <Link to="/register" className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-500 transition-all transform hover:scale-105 shadow-lg shadow-primary-900/50">
                            Signup
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Services</h2>
                    <p className="text-slate-600">Everything you need for a comfortable stay</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { title: 'Luxury Rooms', icon: '🛏️' },
                        { title: 'Fine Dining', icon: '🍽️' },
                        { title: 'Premium Transport', icon: '🚗' },
                        { title: 'Activities Booking', icon: '🎯' },
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-900 text-slate-400 py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-8">
                    <div className="text-center">
                        <span className="font-bold text-white text-lg">Janas Blue Water Corner</span>
                        <p className="text-sm mt-2">© 2026 Hotel Management System</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
