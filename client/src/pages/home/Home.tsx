import Bestsellers from "./components/Bestsellers"
import Categories from "./components/Categories"
import Hero from "./components/Hero"
import Testimonials from "./components/Testimonials"
import Truvora from "./components/Truvora"
import usePageTitle from "../../hooks/usePageTitle"

const Home = () => {
  usePageTitle()

  return (
    <div className="bg-[#FDF8ED] text-[#1A1613]">
      <Hero />
      <Categories />
      <Bestsellers />
      <Testimonials />
      <Truvora />
    </div>
  )
}

export default Home
