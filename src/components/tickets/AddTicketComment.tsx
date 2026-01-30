import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTickets } from "@/hooks/useTickets";
import { toast } from "sonner";

const AddTicketComment = ({ ticketId }: { ticketId: string }) => {
  const [content, setContent] = useState("");
  const { addComment } = useTickets();

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button
        disabled={addComment.isPending || !content.trim()}
        onClick={async () => {
          try {
            await addComment.mutateAsync({ id: ticketId, data: { content, isInternal: false } });
            setContent("");
            toast.success("Comment added");
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to add comment");
          }
        }}
      >
        {addComment.isPending ? "Posting..." : "Post"}
      </Button>
    </div>
  );
};

export default AddTicketComment;
