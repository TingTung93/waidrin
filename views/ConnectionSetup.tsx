// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Code, Flex, Link, Select, Tabs, Text, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { GiOuroboros } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import { usePluginsStateStore } from "@/app/plugins";
import WizardStep from "@/components/WizardStep";
import { fetchAvailableModels, type ModelInfo } from "@/lib/backend";
import { useStateStore } from "@/lib/state";

export default function ConnectionSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { apiUrl, apiKey, model, activeBackend, setState } = useStateStore(
    useShallow((state) => ({
      apiUrl: state.apiUrl,
      apiKey: state.apiKey || "",
      model: state.model || "",
      activeBackend: state.activeBackend,
      setState: state.set,
    })),
  );

  const { backendUIs } = usePluginsStateStore(
    useShallow((state) => ({
      backendUIs: state.backendUIs,
    })),
  );
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const fetchModels = useCallback(async () => {
    if (!apiUrl) return;
    
    setFetchingModels(true);
    try {
      console.log("Fetching models for URL:", apiUrl, "API Key:", apiKey ? "provided" : "not provided");
      const models = await fetchAvailableModels(apiUrl, apiKey);
      console.log("Fetched models:", models);
      setAvailableModels(models);
      
      // Auto-select first model if none selected and models available
      if (!model && models.length > 0) {
        setState((state) => {
          state.model = models[0].id;
        });
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setAvailableModels([]);
    } finally {
      setFetchingModels(false);
    }
  }, [apiUrl, apiKey, model, setState]);

  // Auto-fetch models when URL changes (and optionally when API key changes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (apiUrl) { // Only require URL, not API key
        fetchModels();
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [apiUrl, apiKey, fetchModels]);

  return (
    <WizardStep title="Connection" onNext={onNext} onBack={onBack}>
      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          <Tabs.Root
            value={activeBackend}
            onValueChange={(value) =>
              setState((state) => {
                state.activeBackend = value;
              })
            }
          >
            <Tabs.List>
              <Tabs.Trigger value="default">
                <Text size="6">OpenAI-compatible</Text>
              </Tabs.Trigger>
              {backendUIs.map((backendUI) => (
                <Tabs.Trigger key={backendUI.backendName} value={backendUI.backendName}>
                  <Text size="6">{backendUI.configurationTab}</Text>
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Box mt="5">
              <Tabs.Content value="default">
                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">API base URL</Text>
                      <Text size="4" color="gray">
                        Usually ends with <Code size="3">/v1/</Code>
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={apiUrl}
                      onChange={(event) =>
                        setState((state) => {
                          state.apiUrl = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="http://localhost:8080/v1/"
                    />
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">API key</Text>
                      <Text size="4" color="gray">
                        Can be left empty for local servers
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={apiKey}
                      onChange={(event) =>
                        setState((state) => {
                          state.apiKey = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="X-ABCDE-123456789"
                    />
                    <Text size="4" color="orange">
                      <strong>Note:</strong> The key is stored in the browser, not on the server where Waidrin runs.
                    </Text>
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">Model</Text>
                      <Text size="4" color="gray">
                        Can be left empty for llama.cpp and Kobold
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={model}
                      onChange={(event) =>
                        setState((state) => {
                          state.model = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="mistral-small3.2"
                    />
                  </Label.Root>
                </Box>

                <Box>
                  <Text size="5" color="amber">
                    <strong>Note:</strong> Waidrin uses constrained generation. It requires support for JSON schema
                    constraints (the <Code size="4">response_format</Code> parameter with the{" "}
                    <Code size="4">json_schema</Code> type). Backends that support JSON schemas include the{" "}
                    <Link href="https://github.com/ggml-org/llama.cpp/tree/master/tools/server">llama.cpp server</Link>,{" "}
                    <Link href="https://github.com/LostRuins/koboldcpp">KoboldCpp</Link>,{" "}
                    <Link href="https://ollama.com">Ollama</Link>, and many cloud providers. Some providers support
                    schemas only for certain models; check the provider documentation if in doubt.
                  </Text>
                </Box>
              </Tabs.Content>

              {backendUIs.map((backendUI) => (
                <Tabs.Content key={backendUI.backendName} value={backendUI.backendName}>
                  {backendUI.configurationPage}
                </Tabs.Content>
              ))}
            </Box>
          </Tabs.Root>
        </Box>
        <Box flexGrow="1">
          <Box mb="5">
            <Label.Root>
              <Text size="6">
                API Endpoint URL
              </Text>
              <TextField.Root
                value={apiUrl}
                onChange={(event) =>
                  setState((state) => {
                    state.apiUrl = event.target.value;
                  })
                }
                className="mt-1 font-mono"
                size="3"
                placeholder="http://localhost:8080 or https://api.mistral.ai"
              />
            </Label.Root>
          </Box>

          <Box mb="5">
            <Label.Root>
              <Text size="6">
                API Key (optional for local servers)
              </Text>
              <TextField.Root
                value={apiKey}
                onChange={(event) =>
                  setState((state) => {
                    state.apiKey = event.target.value;
                  })
                }
                className="mt-1 font-mono"
                size="3"
                placeholder="sk-... or leave empty for local servers"
                type="password"
              />
            </Label.Root>
          </Box>

          <Box mb="5">
            <Label.Root>
              <Flex align="center" gap="3" mb="2">
                <Text size="6">Model</Text>
                <Button
                  size="1"
                  variant="soft"
                  onClick={fetchModels}
                  disabled={!apiUrl || fetchingModels}
                >
                  {fetchingModels ? "Fetching..." : "Refresh Models"}
                </Button>
              </Flex>
              <Select.Root
                value={model}
                onValueChange={(value) =>
                  setState((state) => {
                    state.model = value;
                  })
                }
                disabled={availableModels.length === 0}
              >
                <Select.Trigger className="w-full" placeholder="Select a model..." />
                <Select.Content>
                  {availableModels.map((modelInfo) => (
                    <Select.Item key={modelInfo.id} value={modelInfo.id}>
                      <Flex align="center" gap="2">
                        <Text>
                          {modelInfo.name || modelInfo.id}
                        </Text>
                        {modelInfo.isFree && (
                          <Text size="1" color="green" style={{ fontWeight: 'bold' }}>
                            FREE
                          </Text>
                        )}
                      </Flex>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              {availableModels.length === 0 && !fetchingModels && apiUrl && (
                <Text size="2" color="gray" className="block mt-1">
                  No models found. Check console for errors. For local servers, any value can be used.
                </Text>
              )}
            </Label.Root>
          </Box>

          <Box mb="5">
            <Text size="5" color="amber">
              <strong>Supported endpoints:</strong>
            </Text>
            <Text size="4" color="amber" className="block mt-2">
              • <strong>Local llama.cpp server:</strong> Recommended for best compatibility{" "}
              <Link href="https://github.com/ggml-org/llama.cpp/tree/master/tools/server">(setup guide)</Link>
            </Text>
            <Text size="4" color="amber" className="block mt-1">
              • <strong>OpenAI-compatible APIs:</strong> Mistral API, OpenRouter, etc. (requires API key)
            </Text>
            <Text size="4" color="amber" className="block mt-2">
              <strong>Note:</strong> Waidrin requires structured generation support. Some endpoints may have subtle 
              differences in JSON schema handling.
            </Text>
          </Box>

          <Box>
            <Text size="5" color="mint">
              The recommended model is <strong>Mistral Small 2506</strong>. For local deployment, GGUFs are available{" "}
              <Link href="https://huggingface.co/bartowski/mistralai_Mistral-Small-3.2-24B-Instruct-2506-GGUF">
                here
              </Link>
              . Use whichever quant fits your VRAM. Make sure you load the model with a context size of at least{" "}
              <strong>16k</strong>.
            </Text>
          </Box>
        </Box>

        <Box className="w-[250px]">
          <GiOuroboros className="transform scale-x-[-1] -mr-5" size="250" color="var(--amber-8)" />
        </Box>
      </Flex>
    </WizardStep>
  );
}
