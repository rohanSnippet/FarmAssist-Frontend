import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  FaSeedling,
  FaTractor,
  FaChartPie,
  FaCloudSun,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  // Parallax effect for hero text
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVars = {
    hidden: { y: 30, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans overflow-x-hidden selection:bg-primary selection:text-white">
      {/* --- CINEMATIC HERO SECTION --- */}
      <div className="relative w-full h-screen overflow-hidden flex items-center">
        {/* Animated Background Layer */}
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1625246333195-58f214f76328?q=80&w=2574&auto=format&fit=crop")',
          }}
        />

        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10"></div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-20">
          <motion.div
            style={{ y: yHero, opacity: opacityHero }}
            initial="hidden"
            animate="show"
            variants={containerVars}
            className="max-w-3xl"
          >
            <motion.div
              variants={itemVars}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-[2px] w-16 bg-primary"></div>
              <span className="uppercase tracking-[0.3em] text-xs font-bold text-gray-300">
                Precision Agriculture
              </span>
            </motion.div>

            <motion.h1
              variants={itemVars}
              className="text-6xl md:text-8xl font-bold text-white leading-[1.1] mb-8"
            >
              Cultivate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Intelligence.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVars}
              className="text-xl text-gray-300 font-light max-w-xl leading-relaxed mb-10 border-l-4 border-white/20 pl-6"
            >
              Advanced analytics for the modern farmer. Optimize your soil,
              predict your yield, and secure your harvest with data-driven
              precision.
            </motion.p>

            <motion.div variants={itemVars} className="flex flex-wrap gap-5">
              <button
                onClick={() => navigate("/crop-recommendations")}
                className="btn btn-primary btn-lg rounded-none min-w-[200px] border-none text-white hover:brightness-110 shadow-2xl shadow-primary/30"
              >
                Start Analysis
              </button>
              <button
                onClick={() => navigate("/about")}
                className="btn btn-outline btn-lg rounded-none min-w-[200px] text-white border-white/30 hover:bg-white hover:text-black hover:border-white transition-all duration-300"
              >
                Learn More
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </motion.div>
      </div>

      {/* --- STATS STRIP (Minimal & Clean) --- */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-base-300 border-x border-base-300">
            {[
              { label: "Accuracy Rate", val: "99.2%" },
              { label: "Farmers Active", val: "15k+" },
              { label: "Data Points", val: "1M+" },
              { label: "Market Growth", val: "24/7" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 text-center hover:bg-base-200 transition-colors duration-300 group cursor-default"
              >
                <h3 className="text-3xl font-bold text-base-content group-hover:text-primary transition-colors">
                  {stat.val}
                </h3>
                <p className="text-xs uppercase tracking-wider text-base-content/60 mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* --- SERVICES SECTION --- */}
      <div className="py-32 bg-base-200 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-4 text-base-content">
                Essential Toolkit
              </h2>
              <div className="h-1 w-24 bg-primary"></div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-base-content/60 max-w-md text-right mt-6 md:mt-0"
            >
              Deploying cutting-edge algorithms to solve the oldest problems in
              agriculture.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Crop Recommendation",
                icon: FaSeedling,
                desc: "Input soil NPK parameters to receive scientifically backed crop suggestions optimized for your specific region.",
                link: "/crop-recommendations",
              },
              {
                title: "Yield Prediction",
                icon: FaChartPie,
                desc: "Forecast production volume using historical data and machine learning models to plan your logistics ahead of time.",
                link: "/yield",
              },
              {
                title: "Weather Intelligence",
                icon: FaCloudSun,
                desc: "Hyper-local weather alerts and humidity tracking to optimize irrigation schedules and prevent crop loss.",
                link: "/weather",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                onClick={() => navigate(item.link)}
                className="group bg-base-100 p-10 cursor-pointer border border-transparent hover:border-base-300 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-500"></div>

                <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center text-primary text-2xl mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <item.icon />
                </div>

                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  {item.title}
                  <FaArrowRight className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </h3>
                <p className="text-base-content/60 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* --- PARALLAX FEATURE SECTION --- */}
      <div
        className="relative py-40 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2670&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="container mx-auto px-6 relative z-10 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-bold mb-8 leading-tight">
                Technology that respects tradition.
              </h2>
              <p className="text-xl text-gray-300 font-light mb-8">
                We don't replace the farmer's intuition. We enhance it. By
                processing millions of data points, we provide the clarity you
                need to make the hard decisions.
              </p>
              <button className="btn btn-outline border-white text-white rounded-none px-8 hover:bg-white hover:text-black">
                Read Our Manifesto
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="grid gap-6"
            >
              {[
                "Real-time Market Analytics",
                "Soil Health Monitoring",
                "Pest & Disease Alerts",
                "Government Scheme Integration",
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 border-l-4 border-primary"
                >
                  <div className="bg-primary/20 p-2 rounded-full text-primary">
                    <FaCheck size={14} />
                  </div>
                  <span className="font-medium text-lg tracking-wide">
                    {feature}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- CTA FOOTER --- */}
      <div className="py-24 bg-neutral text-neutral-content text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-6"
        >
          <h2 className="text-4xl font-bold mb-6">
            Ready to scale your operations?
          </h2>
          <p className="text-neutral-content/60 max-w-2xl mx-auto mb-10 text-lg">
            Join a network of progressive farmers leveraging data to build a
            sustainable future.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="btn btn-primary btn-lg rounded-none px-12 text-lg shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all"
          >
            Get Started Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
