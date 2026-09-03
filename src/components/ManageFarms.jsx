import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import FarmBoundaryMapper from "./FarmBoundaryMapper";
import MyFarmsDashboard from "./MyFarmsDashboard";
import api from "../axios";
import { ArrowLeft, Map, Plus } from "lucide-react";

const ManageFarms = () => {
  const { t } = useTranslation();
  const [isAddingFarm, setIsAddingFarm] = useState(false);
  const [farmName, setFarmName] = useState("");

  const closeAddFarm = () => {
    setIsAddingFarm(false);
    setFarmName("");
  };

  const handleSaveFarmToBackend = async (geoJsonData) => {
    try {
      const payload = {
        name: farmName || t("manageFarms.default_farm_name", "My New Farm"),
        boundaries: geoJsonData,
      };

      console.log("Data ready for Django:", payload);

      const response = await api.post("/api/farms/", payload);

      if (response.status === 201 || response.status === 200) {
        alert(t("manageFarms.save_success", "Farm saved successfully!"));
        closeAddFarm();
      } else {
        alert(t("manageFarms.save_error", "Error saving farm..."));
      }
    } catch (error) {
      console.error("Error saving farm:", error);
      alert(t("manageFarms.save_failed", "An error occurred while communicating with the server."));
    }
  };

  return (
    <div className="min-h-screen w-full bg-base-200">
      {/* =====================================================
          MOBILE HEADER
          Only page-level header on mobile
      ===================================================== */}
      <header className="md:hidden sticky top-0 z-50 bg-base-100 border-b border-base-content/10 shadow-sm">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isAddingFarm ? (
              <button
                type="button"
                onClick={closeAddFarm}
                className="btn btn-ghost btn-circle btn-sm shrink-0"
                aria-label="Back to farms"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Map size={19} />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="font-black text-base leading-none truncate">
                {isAddingFarm ? t("manageFarms.add_farm_title", "Add Farm") : t("manageFarms.my_farms_title", "My Farms")}
              </h1>

              <p className="text-[10px] text-base-content/50 mt-1 truncate">
                {isAddingFarm
                  ? t("manageFarms.add_farm_subtitle", "Define your farm boundary")
                  : t("manageFarms.manage_farms_subtitle", "Manage your agricultural land")}
              </p>
            </div>
          </div>

          {/* 
             IMPORTANT:
             No Add button here.
             Add button exists only as the desktop header action
             and mobile FAB below.
          */}
        </div>
      </header>

      {/* =====================================================
          DESKTOP PAGE HEADER
          Only page-level header on desktop
      ===================================================== */}
      <header className="hidden md:block max-w-7xl mx-auto px-6 pt-28 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
              {t("manageFarms.page_heading", "Farm Management")}
            </p>

            <h1 className="text-3xl font-black text-base-content mt-1">
              {t("manageFarms.my_farms_title", "My Farms")}
            </h1>
          </div>

          {!isAddingFarm && (
            <button
              type="button"
              onClick={() => setIsAddingFarm(true)}
              className="
                btn
                btn-primary
                rounded-xl
                px-5
                shadow-md
                gap-2
              "
            >
              <Plus size={18} />
              {t("manageFarms.add_new_farm", "Add New Farm")}
            </button>
          )}
        </div>
      </header>

      {/* =====================================================
          FARM LIST
      ===================================================== */}
      {!isAddingFarm ? (
        <main
          className="
          w-full
          max-w-7xl
          mx-auto
          px-3
          sm:px-4
          md:px-6
          pb-24
        "
        >
          <MyFarmsDashboard
            onAddFarm={() => {
              setIsAddingFarm(true);
              setFarmName("");
            }}
          />
        </main>
      ) : (
        /* ===================================================
           ADD FARM
        =================================================== */
        <main
          className="
          w-full
          max-w-5xl
          mx-auto
          px-3
          sm:px-4
          md:px-6
          pb-8
          md:pb-12
        "
        >
          <div
            className="
            bg-base-100
            md:rounded-3xl
            md:border
            md:border-base-content/10
            md:shadow-xl
            overflow-hidden
          "
          >
            {/* ===============================================
                DESKTOP ADD FARM HEADER
            =============================================== */}
            <div
              className="
              hidden
              md:flex
              px-8
              py-6
              border-b
              border-base-content/10
              items-center
              justify-between
            "
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-base-content/40">
                  New Property
                </p>

                <h2 className="text-2xl font-black mt-1">
                  {t("manageFarms.define_boundary_title", "Define Farm Boundary")}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAddFarm}
                className="btn btn-ghost rounded-xl"
              >
                {t("manageFarms.cancel", "Cancel")}
              </button>
            </div>
            {/* ===============================================
                FARM NAME
            =============================================== */}
            <div
              className="
              p-4
              md:px-8
              md:pt-6
              md:pb-4
            "
            >
              <label className="block">
                <span
                  className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-base-content/70
                "
                >
                  {t("manageFarms.farm_name_label", "Farm Name")}
                </span>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder={t("manageFarms.farm_name_placeholder", "My New Farm")}
                  className="
                    mt-2
                    input
                    input-bordered
                    w-full
                    bg-base-200
                    rounded-xl
                  "
                />
              </label>
            </div>

            {/* ===============================================
                MAP
            =============================================== */}
            <div
              className="
              w-full
              px-2
              pb-2
              md:px-8
              md:pb-8
            "
            >
              <FarmBoundaryMapper
                onSaveFarm={handleSaveFarmToBackend}
                onCancel={closeAddFarm}
              />
            </div>

            {/* ===============================================
                MOBILE CANCEL
            =============================================== */}
            <div className="md:hidden px-4 pb-5">
              <button
                type="button"
                onClick={closeAddFarm}
                className="
                  btn
                  btn-ghost
                  w-full
                  h-12
                  min-h-12
                  rounded-xl
                  text-base-content/60
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================
          MOBILE ADD FARM FAB
          
          Only shown on farm-list screen.
          This is the ONLY mobile Add Farm button.
      ===================================================== */}
      {!isAddingFarm && (
        <button
          type="button"
          onClick={() => setIsAddingFarm(true)}
          aria-label="Add new farm"
          className="
            md:hidden
            fixed
            right-5
            bottom-6
            z-40

            w-14
            h-14
            min-h-14

            rounded-full
            bg-primary
            text-primary-content

            shadow-xl
            shadow-primary/30

            flex
            items-center
            justify-center

            active:scale-95
            transition-transform
          "
        >
          <Plus size={25} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default ManageFarms;
