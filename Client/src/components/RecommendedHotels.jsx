import HotelCard from "./HotelCard";
import Title from "./Title";
import { useAppContext } from "../context/AppContext";
import { useEffect, useState } from "react";

const RecommendedHotels = () => {
  const { rooms, searchedCities } = useAppContext();
  const [recommeded, setRecommeded] = useState([]);

  const filterHotels = () => {
    const filteredHotels = rooms
      .slice()
      .filter((room) => searchedCities.includes(room.hotel.city));

    setRecommeded(filteredHotels);
  };

  useEffect(() => {
    filterHotels();
  }, [rooms, searchedCities]);

  return (
    recommeded.length > 0 && (
      <div className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 py-20">
        <Title
          title="Recommended Hotels"
          subTitle="Discover our handpicked selection of exceptional properties around the world, offering unparalled luxury and unforgettable experiences."
        />

        <div className="flex flex-wrap justify-center items-center gap-6 mt-20">
          {recommeded.slice(0, 4).map((room, index) => (
            <HotelCard key={room._id} room={room} index={index} />
          ))}
        </div>

        <button
          onClick={() => {
            navigate("/rooms");
            scrollTo(0, 0);
          }}
          className="my-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer"
        >
          View All Destinations
        </button>
      </div>
    )
  );
};

export default RecommendedHotels;
