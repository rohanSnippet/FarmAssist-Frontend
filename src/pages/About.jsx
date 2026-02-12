import React from "react";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaRocket,
  FaCode,
  FaHeart,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

// Team Data Configuration
const teamMembers = [
  {
    name: "Rohan More",
    role: "Backend Developer",
    bio: "",
    github: "https://github.com/rohanSnippet",
    linkedin: "#", // Placeholder
    // GitHub automatically provides avatar images via this URL pattern
    image: "https://github.com/rohanSnippet.png",
  },
  {
    name: "Harshada Sonar",
    role: "Frontend Developer",
    bio: "",
    github: "https://github.com/harshadasnr-cloud",
    linkedin: "#", // Placeholder
    image: "https://github.com/harshadasnr-cloud.png",
  },
  {
    name: "Kirisraja Navidhar",
    role: "ML trainer",
    bio: "",
    github: "https://github.com/Kirisraja",
    linkedin: "#", // Placeholder
    image: "https://github.com/Kirisraja.png",
  },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const About = () => {

  const { t } = useTranslation();

  const values = [
    { icon: FaRocket, title: t("About.values.fast_title"), desc: t("About.values.fast_desc") },
    { icon: FaCode, title: t("About.values.clean_title"), desc: t("About.values.clean_desc") },
    { icon: FaHeart, title: t("About.values.passion_title"), desc: t("About.values.passion_desc") },
  ];
  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      {/* --- HERO SECTION --- */}
      <div className="hero min-h-[60vh] bg-base-100 relative overflow-hidden py-48">
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>

        <div className="hero-content text-center z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                {t("About.hero_title_1")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                 {t("About.hero_title_2")}
                </span>
              </h1>
              <p className="py-6 text-lg md:text-xl text-base-content/80">
                {t("About.hero_desc")}
              </p>
              <button className="btn btn-primary btn-lg shadow-lg hover:scale-105 transition-transform">
               {t("About.hero_cta")}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- VALUES SECTION --- */}
      <div className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           {values.map((item, index) => (
            <motion.div key={index} whileInView={{ opacity: 1 }}>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <item.icon className="text-4xl text-secondary mb-4" />
                  <h2 className="card-title text-2xl">{item.title}</h2>
                  <p>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- TEAM SECTION --- */}
      <div className="py-20 bg-base-100/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">{t("About.team_title")}</h2>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto"
          >
            {teamMembers.map((member, index) => (
              <motion.div variants={itemVariants} key={index}>
                <div className="group card w-full bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-base-300">
                  <figure className="relative h-64 overflow-hidden bg-base-300">
                    {/* Image with gradient overlay on hover */}
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <p className="text-white font-semibold">
                         {t("About.connect_with")} {member.name.split(" ")[0]}
                      </p>
                    </div>
                  </figure>

                  <div className="card-body items-center text-center relative">
                    {/* Floating Avatar Border */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                      <div className="avatar">
                        <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          <img src={member.image} alt="avatar-small" />
                        </div>
                      </div>
                    </div>

                    <h2 className="card-title text-2xl mt-8">{member.name}</h2>
                    <div className="badge badge-secondary badge-outline mb-2">
                      {member.role}
                    </div>
                    <p className="text-base-content/70 mb-6">{member.bio}</p>

                    <div className="card-actions flex gap-4">
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-circle btn-ghost text-2xl hover:text-primary transition-colors"
                      >
                        <FaGithub />
                      </a>
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-circle btn-ghost text-2xl hover:text-blue-600 transition-colors"
                      >
                        <FaLinkedin />
                      </a>
                      <a
                        href="#"
                        className="btn btn-circle btn-ghost text-2xl hover:text-sky-400 transition-colors"
                      >
                        <FaTwitter />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div className="hero bg-base-200 py-20">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold"> {t("About.footer_title")}</h1>
            <p className="py-6">
              {t("About.footer_desc")}
            </p>
            <button className="btn btn-wide btn-primary"> {t("About.footer_btn")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
