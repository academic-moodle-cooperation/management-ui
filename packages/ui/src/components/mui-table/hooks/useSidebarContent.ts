import { MetadataItem } from '@workspace/ui-config';
import { useState, useEffect } from 'react';

/**
 * Hook for handling common sidebar content behavior like copy text functionality
 */
export function useSidebarContent() {
  const [textCopied, setTextCopied] = useState(false);
  const [updateField, setUpdateField] = useState('');

  // Reset text copied state after 5 seconds
  useEffect(() => {
    if (!textCopied) return;

    const timeout = setTimeout(() => {
      setTextCopied(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [textCopied]);

  const handleTextCopied = () => {
    setTextCopied(true);
  };

  return {
    textCopied,
    setTextCopied: handleTextCopied,
    updateField,
    setUpdateField
  };
}

export interface MetadataHelpers {
  isVisible: (field: string) => boolean;
  isReadOnly: (field: string) => boolean;
}

/**
 * Creates helper functions for handling metadata fields
 */
export function createMetadataHelpers(metadata: MetadataItem[]): MetadataHelpers {
  const readonlyMetadata = metadata?.filter(
    (field: MetadataItem) => Object.values(field)[0]?.readonly
  ) || [];

  const visibleMetadata = metadata?.filter(
    (field: MetadataItem) => Object.values(field)[0]?.show
  ) || [];

  const isVisible = (field: string) => {
    return visibleMetadata.some((item) => Object.keys(item)[0] === field);
  };

  const isReadOnly = (field: string) => {
    return readonlyMetadata.some((item) => Object.keys(item)[0] === field);
  };

  return {
    isVisible,
    isReadOnly
  };
}
