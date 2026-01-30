import { useState } from "react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CampaignBuilderDialog from "@/components/campaigns/CampaignBuilderDialog";

const Campaigns = () => {
  const [open, setOpen] = useState(false);
  const { list, create, previewRecipients, schedule } = useCampaigns({ page: 1, limit: 50 });

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const campaigns = list.data?.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Segmentation + scheduling (log-only send)</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Campaign List</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="border rounded-md p-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                {c.campaignNumber} • {c.channel} • {c.status}
              </div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.description || "—"}</div>

              {c.status === "DRAFT" && (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await schedule.mutateAsync({ id: c.id, data: { scheduledAt: new Date().toISOString() } });
                      toast.success("Campaign scheduled");
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || "Failed to schedule");
                    }
                  }}
                >
                  Schedule now
                </Button>
              )}
            </div>
          ))}
          {campaigns.length === 0 && <div className="text-sm text-muted-foreground">No campaigns yet.</div>}
        </CardContent>
      </Card>

      <CampaignBuilderDialog
        open={open}
        onOpenChange={setOpen}
        loading={create.isPending}
        onPreview={async (criteria) => previewRecipients.mutateAsync(criteria)}
        onSubmit={async (payload) => {
          try {
            await create.mutateAsync(payload);
            toast.success("Campaign created");
            setOpen(false);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to create campaign");
          }
        }}
      />
    </div>
  );
};

export default Campaigns;
