import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export type UserInfo = {
  org: {
    anonymousRole: string;
    name: string;
    adminRole: string;
    id: string;
    properties: unknown;
  };
  roles: string[];
  userRole: string;
  user: {
    name: string;
    email: string;
    username: string;
  };
};

const fetchUserInfo = async () => {
  const response = await fetch("/info/me.json");
  if (!response.ok) {
    throw new Error("Could not fetch user info");
  }
  const data = await response.json();
  return data;
};

export function useGetUserInfo(): UseQueryResult<UserInfo> {
  return useQuery({
    queryKey: ["userInfo"],
    queryFn: fetchUserInfo,
    staleTime: 3000,
  });
}
