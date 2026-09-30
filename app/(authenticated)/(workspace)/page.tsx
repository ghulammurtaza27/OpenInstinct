import {
  BotIcon,
  DatabaseIcon,
  HardDriveIcon,
  MessageSquareIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@web/components/ui/badge";
import { Button } from "@web/components/ui/button";
import { env } from "@shared/environment";

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="sr-only">Workspace</h1>

      <ChannelsSection />

      <WorkspaceSection headingId="connectors-heading" title="Infrastructure">
        <div className="divide-y divide-border/50 border-y border-border/50">
          <ConnectorRow
            action={<Badge variant="success">Connected</Badge>}
            description={`${env.LOCAL_MODEL_ID} through ${env.LOCAL_MODEL_BASE_URL}`}
            icon={<BotIcon />}
            label="Local Qwen model"
          />
          <ConnectorRow
            action={<Badge variant="success">Local</Badge>}
            description="Chats, profiles, workstreams, vault metadata, and schedules."
            icon={<DatabaseIcon />}
            label="PostgreSQL"
          />
          <ConnectorRow
            action={<Badge variant="success">Local</Badge>}
            description={env.LOCAL_DATA_DIR}
            icon={<HardDriveIcon />}
            label="Private file storage"
          />
        </div>
      </WorkspaceSection>
    </div>
  );
}

export function ChannelsSection() {
  return (
    <WorkspaceSection headingId="channels-heading" title="Channels">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          nativeButton={false}
          render={<Link href="/chat" />}
          variant="surface"
        >
          <MessageSquareIcon />
          Private WebChat
        </Button>
      </div>
      <p className="type-caption text-muted-foreground">
        Served from this computer and reachable privately over Tailscale.
      </p>
    </WorkspaceSection>
  );
}

function WorkspaceSection({
  children,
  headingId,
  title,
}: {
  readonly children: ReactNode;
  readonly headingId: string;
  readonly title: string;
}) {
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 className="type-section-title" id={headingId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ConnectorRow({
  action,
  description,
  icon,
  label,
}: {
  readonly action: ReactNode;
  readonly description: string;
  readonly icon: ReactNode;
  readonly label: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="type-label">{label}</p>
        <p className="truncate type-caption text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
