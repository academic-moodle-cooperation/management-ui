import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetCurrentUser } from "@opencast-mui/query";

import { useUserData } from "./nav-user";

vi.mock("@opencast-mui/query", () => ({
  useGetCurrentUser: vi.fn(),
}));

const mockUseGetCurrentUser = vi.mocked(useGetCurrentUser);

type MockCurrentUser = {
  __typename: "CurrentUser";
  email?: string | null;
  name?: string | null;
  username?: string | null;
  userRole: string;
};

function mockCurrentUser(currentUser: MockCurrentUser | null) {
  mockUseGetCurrentUser.mockReturnValue({
    data: currentUser ? { currentUser } : undefined,
    isLoading: false,
  } as ReturnType<typeof useGetCurrentUser>);
}

describe("useUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no user data when there is no current user", () => {
    mockCurrentUser(null);

    const { result } = renderHook(() => useUserData());

    expect(result.current.userData).toBeUndefined();
  });

  // The app shell must not call any external avatar service (gravatar.com): it
  // leaks a hash of the user's email to a third party — counter to the
  // project's GDPR/offline stance — and 404s for any user without a Gravatar.
  // The initials AvatarFallback is the only avatar. These assert no external
  // avatar URL is ever produced, so the Gravatar request can't be reintroduced.
  it("never produces an external avatar URL for an anonymous user", () => {
    mockCurrentUser({
      __typename: "CurrentUser",
      email: null,
      name: null,
      username: "anonymous",
      userRole: "ROLE_ANONYMOUS",
    });

    const { result } = renderHook(() => useUserData());

    expect(result.current.userData).toBeDefined();
    expect(result.current.userData?.avatarUrl).toBeUndefined();
  });

  it("never produces an external avatar URL even for an authenticated user with an email", () => {
    mockCurrentUser({
      __typename: "CurrentUser",
      email: "user@example.com",
      name: "Example User",
      username: "example",
      userRole: "ROLE_USER",
    });

    const { result } = renderHook(() => useUserData());

    expect(result.current.userData?.avatarUrl).toBeUndefined();
  });
});
