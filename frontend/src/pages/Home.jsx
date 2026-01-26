import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StarIcon, WifiIcon, TvIcon } from '@heroicons/react/24/solid';

const Home = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Section */}
            <div className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 z-10" />

                <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Luxury Hotel"
                    className="absolute inset-0 h-full w-full object-cover transform scale-105 animate-slow-zoom"
                />

                <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <h2 className="text-white text-lg md:text-xl uppercase tracking-[0.3em] mb-4 font-semibold drop-shadow-md">
                            Welcome to
                        </h2>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-8 tracking-wide drop-shadow-2xl">
                            Janas Blue Water Corner
                        </h1>
                        <div className="w-24 h-1 bg-gold-500 mx-auto mb-8 shadow-lg"></div>
                        <p className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-lg">
                            Experience the epitome of luxury and comfort in the heart of paradise.
                            Where every moment is crafted to perfection.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="flex flex-col md:flex-row gap-6"
                    >
                        <Link
                            to="/login"
                            className="px-10 py-4 bg-transparent border-2 border-white text-white font-serif font-bold text-lg hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-widest"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="px-10 py-4 bg-transparent border-2 border-white text-white font-serif font-bold text-lg hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-widest"
                        >
                            Become a Member
                        </Link>
                    </motion.div>
                </div>
            </div>





            {/* Facilities Section */}
            <section className="py-24 bg-slate-50 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">

                        <h2 className="text-4xl md:text-5xl font-serif text-slate-900">Experience Everything</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                title: 'Room Booking',
                                icon: '🛏️',
                                desc: 'Elegant suites and ocean-view rooms for your perfect stay.',
                                link: '/rooms'
                            },
                            {
                                title: 'Activity Booking',
                                icon: '🏄‍♂️',
                                desc: 'Explore Trincomalee with our curated adventures and tours.',
                                link: '/activities'
                            },
                            {
                                title: 'Food Orders',
                                icon: '🍽️',
                                desc: 'Gourmet dining delivered to your room or served at our restaurant.',
                                link: '/food-orders'
                            },
                            {
                                title: 'Vehicle Booking',
                                icon: '🚗',
                                desc: 'Reliable transport services for your convenience.',
                                link: '/vehicle-hire'
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-gold-500 group"
                            >
                                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                <h3 className="text-2xl font-serif text-slate-900 mb-4">{item.title}</h3>
                                <p className="text-slate-600 mb-8 leading-relaxed h-20">{item.desc}</p>

                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-6 border-t border-white/10">
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-serif font-bold text-gold-500 mb-4 uppercase tracking-wider">About Us</h3>
                        <p className="text-slate-400 leading-relaxed text-sm mb-4">
                            Janas Blue Water Cotel is a luxury hotel located in Trincomalee.
                        </p>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            73, 9 Sandy Bay Road, Trincomalee, Sri Lanka.
                        </p>
                    </div>
                    <div className="text-center md:text-right">
                        <h4 className="text-xl font-serif font-bold text-gold-500 mb-4 uppercase tracking-wider">Contact Us</h4>
                        <p className="text-slate-400 leading-relaxed text-sm mb-2">
                            +94 77 765 4321
                        </p>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            akshaymukunthan@gmail.com
                        </p>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-xs uppercase tracking-widest">
                    © 2026 Janas Blue Water Corner. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
