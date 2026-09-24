import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { parcelService } from '@/services/api'
import type { Parcel } from '@/types'
import { Search, MapPin } from 'lucide-react'

export default function ParcelSearch() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [ulpin, setUlpin] = useState('')
  const [surveyNumber, setSurveyNumber] = useState('')
  const [landUse, setLandUse] = useState('')
  const [district, setDistrict] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Parcel[]>([])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await parcelService.search({
        ulpin: ulpin || undefined,
        surveyNumber: surveyNumber || undefined,
        landUse: landUse || undefined,
        district: district || undefined,
      })
      setResults(response.data.data || [])
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to search parcels', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Parcel Search</h1>
      <p className="text-muted-foreground mb-8">Search for land parcels by various criteria</p>

      <Card className="bg-card/80 backdrop-blur-sm border-border mb-8">
        <CardHeader>
          <CardTitle className="text-white">Search Filters</CardTitle>
          <CardDescription className="text-muted-foreground">Find parcels using ULPIN, survey number, or other filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ULPIN</Label>
              <Input value={ulpin} onChange={(e) => setUlpin(e.target.value)} placeholder="Enter ULPIN" className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label>Survey Number</Label>
              <Input value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)} placeholder="Enter survey number" className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label>Land Use</Label>
              <Select value={landUse} onValueChange={setLandUse}>
                <select className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1">
                  <option value="">All Land Uses</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Enter district" className="bg-background border-border mt-1" />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="bg-cyan-500 text-black hover:bg-cyan-400 mt-5">
              {loading ? <span className="animate-pulse">Searching...</span> : <><Search className="h-4 w-4 mr-2" />Search</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Results ({results.length})</h2>
          <div className="grid gap-4">
            {results.map((parcel) => (
              <Card key={parcel.ulpin} className="bg-card/80 backdrop-blur-sm border-border hover:border-cyan-500/40 cursor-pointer transition-colors" onClick={() => navigate(`/parcels/${parcel.ulpin}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <MapPin className="h-8 w-8 text-cyan-400" />
                    <div>
                      <h3 className="text-white font-semibold">ULPIN: {parcel.ulpin}</h3>
                      <p className="text-sm text-muted-foreground">
                        Survey: {parcel.surveyNumber} | Area: {parcel.area} acres | {parcel.landUse} | {parcel.district}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
