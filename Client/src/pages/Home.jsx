import ExclusiveOffers from "../components/ExclusiveOffers";
import FeaturedDestination from "../components/FeaturedDestination";
import Hero from "../components/Hero";
import Newsletter from "../components/Newsletter";
import RecommendedHotels from "../components/RecommendedHotels";
import Testimonial from "../components/Testimonial";

const Home = () => {
  return (
    <>
      <Hero />
      <RecommendedHotels />
      <FeaturedDestination />
      <ExclusiveOffers />
      <Testimonial />
      <Newsletter />
    </>
  );
};

export default Home;
