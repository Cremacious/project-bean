import { StatusBar } from "expo-status-bar";
import { ConnectivityProviderScope } from "./src/connectivity/context";
import { AppDataProvider } from "./src/data/store";
import { NotificationsProviderScope } from "./src/notifications/context";
import { LinkingProviderScope } from "./src/linking/context";
import { Navigator } from "./src/navigation/Navigator";

// Bedtime Quests native app (issue #54). The UI is a faithful port of the web
// screens, reusing @bedtime-quests/core for every rule and computation. The data
// layer is local/in-memory for this UI port (see README): auth is a stub, and
// purchasing is deferred to native billing (#55). AppDataProvider holds session +
// gameplay state; NotificationsProviderScope owns the bedtime reminder (#56);
// LinkingProviderScope turns incoming deep / universal links into targets (#65);
// ConnectivityProviderScope tracks online/offline and drives the offline UX (#66);
// Navigator decides the screen flow from that state. Connectivity wraps the data
// layer because the store reads it to queue writes made offline and to sync on
// reconnect.
export default function App() {
  return (
    <ConnectivityProviderScope>
      <AppDataProvider>
        <NotificationsProviderScope>
          <LinkingProviderScope>
            <StatusBar style="dark" />
            <Navigator />
          </LinkingProviderScope>
        </NotificationsProviderScope>
      </AppDataProvider>
    </ConnectivityProviderScope>
  );
}
