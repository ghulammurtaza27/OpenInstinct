"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formValue, verifyPhoneNumber } from "@app/sign-in/_lib/phone-auth";
import { localAccountPhoneNumber } from "@shared/identity/local-auth";
import { Button } from "@web/components/ui/button";
import { FieldError, FieldGroup } from "@web/components/ui/field";
import { Field, FieldLabel } from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";

export function LocalPhoneAuthForm({
  callbackUrl,
}: {
  readonly callbackUrl: string;
}) {
  const router = useRouter();
  const signIn = useMutation({
    mutationFn: async (code: string) => {
      await verifyPhoneNumber({
        code,
        errorMessage: "Invalid local access code.",
        phoneNumber: localAccountPhoneNumber,
      });
    },
    onSuccess: () => {
      router.replace(callbackUrl);
      router.refresh();
    },
  });

  return (
    <form
      className="mt-6"
      onSubmit={(event) => {
        event.preventDefault();
        signIn.mutate(formValue(event.currentTarget, "access-code"));
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="access-code">Local access code</FieldLabel>
          <Input
            autoComplete="off"
            id="access-code"
            inputMode="numeric"
            name="access-code"
            pattern="[0-9]{12}"
            required
            size="xl"
            type="password"
          />
        </Field>
        <FieldError errors={signIn.error ? [signIn.error] : undefined} />
        <Button
          className="w-full"
          disabled={signIn.isPending}
          size="lg"
          type="submit"
        >
          {signIn.isPending ? "Signing in…" : "Continue"}
        </Button>
      </FieldGroup>
    </form>
  );
}
