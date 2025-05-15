"use client"

import { useState, useEffect } from "react"
import { Check, MapPin } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { usePickupLocations, useUpdatePickupLocation, useCurrentUser, useNotificationPreferences } from "@/hooks/useProfile"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface PickupLocationModalProps {
  trigger?: React.ReactNode
}

export const PickupLocationModal = ({ trigger }: PickupLocationModalProps) => {
  const { data: locations, isLoading: isLoadingLocations } = usePickupLocations()
  const { data: user } = useCurrentUser()
  const { data: preferences } = useNotificationPreferences()
  const { mutate: updatePickupLocation, isPending: isUpdating } = useUpdatePickupLocation()
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Update selected location when preferences data loads
  useEffect(() => {
    if (preferences) {
      setSelectedLocation(preferences.pickupLocationId || undefined)
    }
  }, [preferences])

  const handleSave = () => {
    if (selectedLocation) {
      updatePickupLocation(selectedLocation, {
        onSuccess: () => {
          toast({
            title: "Pickup location updated",
            description: "Your preferred pickup location has been updated successfully.",
          })
          setIsOpen(false)
        },
        onError: () => {
          toast({
            title: "Failed to update",
            description: "There was a problem updating your pickup location. Please try again.",
            variant: "destructive",
          })
        }
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="justify-start w-full">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            Manage Pickup Locations
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pickup Locations</DialogTitle>
          <DialogDescription>
            Select your preferred location for package pickups
          </DialogDescription>
        </DialogHeader>

        {isLoadingLocations ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : locations && locations.length > 0 ? (
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {locations.map((location, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedLocation(location)}
                  className={`flex items-center justify-between rounded-md border p-3 cursor-pointer
                    ${selectedLocation === location ? 'bg-muted border-primary' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                  {selectedLocation === location && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No pickup locations available
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating || !selectedLocation}>
            {isUpdating ? 'Saving...' : 'Save Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 