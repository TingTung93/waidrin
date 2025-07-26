// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { AlertDialog, Button, Flex, Text } from "@radix-ui/themes";

export default function ErrorPopup({
  errorMessage,
  onRetry,
  onCancel,
}: {
  errorMessage: string;
  onRetry?: () => void;
  onCancel?: () => void;
}) {
  return (
    <AlertDialog.Root open={true}>
      <AlertDialog.Content maxWidth="40rem">
        <AlertDialog.Title className="lowercase" size="6" color="red">
          Error
        </AlertDialog.Title>

        <AlertDialog.Description size="5">
          <Text className="block mb-4">The following error occurred:</Text>
          <Text className="font-mono" size="3" color="red">
            {errorMessage}
          </Text>
        </AlertDialog.Description>

        <Flex gap="3" mt="6" justify="end">
          {onCancel && (
            <AlertDialog.Cancel>
              <Button variant="classic" color="gray" size="3" onClick={onCancel}>
                <Text size="6">Cancel</Text>
              </Button>
            </AlertDialog.Cancel>
          )}
          {onRetry && (
            <AlertDialog.Action>
              <Button variant="classic" size="3" onClick={onRetry}>
                <Text size="6">Retry</Text>
              </Button>
            </AlertDialog.Action>
          )}
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
