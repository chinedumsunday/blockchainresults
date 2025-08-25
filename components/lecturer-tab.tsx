"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LecturerDashboard } from "./lecturer-dashboard"
import { FileText } from "lucide-react"

export function LecturerTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Lecturer Portal</h2>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-gray-900 border border-gray-700">
          <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-green-600">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="uploads" className="text-white data-[state=active]:bg-green-600">
            Uploads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {/* Lecturer Dashboard includes file upload, parsing & upload history */}
          <LecturerDashboard />
        </TabsContent>

        <TabsContent value="uploads" className="mt-6">
          {/* We can reuse LecturerDashboard since it already shows upload history */}
          <LecturerDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
