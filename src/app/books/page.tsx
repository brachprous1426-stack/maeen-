import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLibraryData } from "@/lib/library-data";
import Library from "@/components/Library";

export default async function Books() {
  const user = await getSession();
  if (!user) redirect("/login");
  const initialData = await getLibraryData(user.id, { type: "BOOK" });
  return <Library key={"BOOK:" + user.id} user={{ id: user.id, name: user.name, role: user.role, groupName: user.groupName }} fixedType="BOOK" initialData={initialData} />;
}
