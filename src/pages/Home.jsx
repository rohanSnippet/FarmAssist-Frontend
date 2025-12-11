import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="">
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl poppins-extrabold">
              Grow Smarter. Sell Higher.
            </h1>
            <p className="py-6 raleway-regular">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
              excepturi exercitationem quasi. In deleniti eaque aut repudiandae
              et a id nisi.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/crop-recommendations")}
            >
              Get Predictions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
