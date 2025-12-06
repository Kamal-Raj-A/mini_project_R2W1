import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useState } from "react";
import * as React from "react";

function ReportIssueModal({ open, onClose, onSubmit }) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!type) return alert("Please enter the issue type");
    onSubmit({ type, description });
    setType("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-[320px] max-w-md translate-x-[-50%] translate-y-[-50%] gap-3 border bg-background p-3 shadow-lg sm:rounded-lg mx-auto rounded-2xl bg-gradient-to-b from-white/90 to-blue-50/90 backdrop-blur-lg border border-blue-100">

        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-800">
            Report Accessibility Issue
          </DialogTitle>
        </DialogHeader>

        {/* Form section */}
        <div className="space-y-4 mt-4 text-center">
          <Input
            placeholder="Issue Type (e.g., Elevator Outage, Ramp Blocked)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-4/5 mx-auto rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 text-center"
          />
          <Textarea
            placeholder="Additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-4/5 mx-auto rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 text-center"
          />
        </div>

        {/* Buttons */}
        <DialogFooter className="flex justify-center gap-4 mt-6">
          <Button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
                       text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Submit
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-gray-200 to-gray-400 
                       text-gray-800 font-semibold hover:from-gray-300 hover:to-gray-500 shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReportIssueModal;
