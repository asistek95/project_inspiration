import dynamic from "next/dynamic";

const DashboardRestructured = dynamic(() => import("./dashboard-restructured"), {
  ssr: false,
});

export default function DashboardPage() {
  return <DashboardRestructured />;
}
