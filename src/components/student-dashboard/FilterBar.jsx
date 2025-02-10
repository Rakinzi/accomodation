import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select"
import { 
  SearchIcon, 
  HomeIcon, 
  UsersIcon, 
  FilterIcon 
} from "lucide-react"

export function FilterBar() {
  return (
    <div className="bg-white/50 backdrop-blur-lg border rounded-xl p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search city or area" 
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Price Range</label>
          <div className="pt-2">
            <Slider
              defaultValue={[0, 50000]}
              max={50000}
              step={1000}
              className="mt-2"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>R0</span>
              <span>R50,000</span>
            </div>
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Property Type</label>
          <Select>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">
                <span className="flex items-center gap-2">
                  <HomeIcon className="w-4 h-4" />
                  Apartment
                </span>
              </SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="shared">Shared Room</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Room Sharing</label>
          <Select>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Preferences" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="male">Male Only</SelectItem>
              <SelectItem value="female">Female Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button className="bg-sky-500 hover:bg-sky-600">
          <FilterIcon className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}