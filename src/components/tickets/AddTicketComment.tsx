import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTickets } from "@/hooks/useTickets";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const AddTicketComment = ({
  ticketId,
  isAdmin = false,
}: {
  ticketId: string;
  isAdmin?: boolean;
}) => {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const { addComment } = useTickets();

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="text-xs font-medium text-muted-foreground">
        Add Comment
      </div>
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={isInternal}
              onCheckedChange={(v) => setIsInternal(!!v)}
            />
            Internal note (not visible to customer)
          </label>
        )}
        {!isAdmin && <div />}
        <Button
          size="sm"
          disabled={addComment.isPending || !content.trim()}
          onClick={async () => {
            try {
              await addComment.mutateAsync({
                id: ticketId,
                data: { content, isInternal },
              });
              setContent("");
              setIsInternal(false);
              toast.success("Comment added");
            } catch (e: any) {
              toast.error(
                e?.response?.data?.message || "Failed to add comment"
              );
            }
          }}
        >
          {addComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
};

export default AddTicketComment;
