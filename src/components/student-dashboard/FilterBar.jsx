"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select"
import { 
  SearchIcon, 
  FilterIcon,
  Users2Icon,
  StarIcon
} from "lucide-react"

export function FilterBar({ onFiltersChange }) {
  const [location, setLocation] = useState("")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [sharing, setSharing] = useState(false)
  const [gender, setGender] = useState("ANY")
  const [religion, setReligion] = useState("ANY")
  const [minRating, setMinRating] = useState("0")

  const formatPrice = (value) => `$${value.toLocaleString()}`

  const handleApplyFilters = () => {
    onFiltersChange({
      location: location || undefined,
      minPrice: priceRange[0] || undefined,
      maxPrice: priceRange[1] || undefined,
      sharing: sharing || undefined,
      gender: gender !== "ANY" ? gender : undefined,
      religion: religion !== "ANY" ? religion : undefined,
      minRating: minRating !== "0" ? parseFloat(minRating) : undefined
    })
  }

  return (
    <div className="bg-white/50 backdrop-blur-lg border rounded-xl p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Search Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search city or area" 
              className="pl-9 bg-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Price Range (Monthly)
          </label>
          <div className="pt-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={500}
              step={10}
              className="mt-2"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Gender Preference */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Gender Preference</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Gender</SelectItem>
              <SelectItem value="MALE">Male Only</SelectItem>
              <SelectItem value="FEMALE">Female Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Religion Preference */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Religion Preference</label>
          <Select value={religion} onValueChange={setReligion}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Religion</SelectItem>
              <SelectItem value="CHRISTIAN">Christian</SelectItem>
              <SelectItem value="MUSLIM">Muslim</SelectItem>
              <SelectItem value="HINDU">Hindu</SelectItem>
              <SelectItem value="BUDDHIST">Buddhist</SelectItem>
              <SelectItem value="JEWISH">Jewish</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Rating Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Minimum Rating</label>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select minimum rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sharing Switch */}
      <div className="flex items-center justify-between mt-6 pb-6 border-b">
        <div className="flex items-center gap-2">
          <Users2Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Show Shared Accommodations</span>
        </div>
        <Switch 
          checked={sharing}
          onCheckedChange={setSharing}
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button 
          className="bg-sky-500 hover:bg-sky-600"
          onClick={handleApplyFilters}
        >
          <FilterIcon className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}