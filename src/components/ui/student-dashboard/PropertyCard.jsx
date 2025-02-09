import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { 
  HeartIcon, 
  MessageSquareIcon, 
  BedSingleIcon, 
  ShowerHead, 
  MapPinIcon 
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

export function PropertyCard({ property }) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/student-dashboard/property/${property.id}`)
  }

  const handleContactClick = (e) => {
    e.stopPropagation() // Prevent navigation when clicking contact button
    // Contact dialog logic here
  }

  const handleGalleryClick = (e) => {
    e.stopPropagation() // Prevent navigation when opening gallery
  }

  const handleFavoriteClick = (e) => {
    e.stopPropagation() // Prevent navigation when favoriting
    // Favorite logic here
  }

  return (
    <Card 
      onClick={handleCardClick}
      className="group relative overflow-hidden border-none ring-1 ring-zinc-100 dark:ring-zinc-900 rounded-xl hover:ring-2 hover:ring-sky-500/50 transition-all duration-300 cursor-pointer"
    >
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-zoom-in" onClick={handleGalleryClick}>
            <AspectRatio ratio={16/9} className="overflow-hidden bg-zinc-50">
              <Image
                src={property.images[0]}
                alt={property.location}
                fill
                className="object-cover transition-all duration-700 hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                {property.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-white/90 backdrop-blur-sm text-zinc-800"
                  >
                    {amenity}
                  </Badge>
                ))}
                {property.amenities.length > 3 && (
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-zinc-800">
                    +{property.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            </AspectRatio>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0">
          <Carousel>
            <CarouselContent>
              {property.images.map((image, index) => (
                <CarouselItem key={index}>
                  <AspectRatio ratio={16/9}>
                    <Image
                      src={image}
                      alt={`View ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </AspectRatio>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </DialogContent>
      </Dialog>

      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              R{property.price.toLocaleString()}/month
            </h3>
            <p className="flex items-center text-sm text-zinc-500 mt-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {property.location}
            </p>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full hover:bg-pink-50 hover:text-pink-600 transition-colors"
            onClick={handleFavoriteClick}
          >
            <HeartIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="flex items-center text-zinc-600">
            <BedSingleIcon className="w-4 h-4 mr-1" />
            {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
          </span>
          <span className="flex items-center text-zinc-600">
            <ShowerHead className="w-4 h-4 mr-1" />
            {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20 transition-all duration-300"
          onClick={handleContactClick}
        >
          <MessageSquareIcon className="w-4 h-4 mr-2" />
          Contact Landlord
        </Button>
      </CardFooter>
    </Card>
  )
}