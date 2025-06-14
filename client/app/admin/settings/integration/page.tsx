'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/apiClient';
import { Switch } from '@/components/ui/switch';
import { CopyIcon, ReloadIcon, CheckIcon } from '@radix-ui/react-icons';
import { Textarea } from '@/components/ui/textarea';

interface IntegrationSettings {
  apiKey?: string;
  allowedOrigins?: string[];
  redirectIntegration?: {
    enabled: boolean;
    allowedDomains?: string[];
  };
  iframeIntegration?: {
    enabled: boolean;
    iframeCode?: string;
    allowedDomains?: string[];
  };
}

export default function IntegrationSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);
  const [settings, setSettings] = useState<IntegrationSettings>({
    apiKey: '',
    allowedOrigins: [],
    redirectIntegration: {
      enabled: false,
      allowedDomains: [],
    },
    iframeIntegration: {
      enabled: false,
      allowedDomains: [],
    },
  });
  const [domainInputValue, setDomainInputValue] = useState('');
  const [originInputValue, setOriginInputValue] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [iframeCodeCopied, setIframeCodeCopied] = useState(false);
  const { toast } = useToast();

  // Fetch integration settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiClient.get('/settings/integration');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching integration settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load integration settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Save settings handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/settings/integration', settings);
      toast({
        title: 'Success',
        description: 'Integration settings saved successfully.',
      });
    } catch (error) {
      console.error('Error saving integration settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save integration settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate new API key
  const generateApiKey = async () => {
    setIsGeneratingApiKey(true);
    try {
      const { apiKey } = await apiClient.post('/settings/integration/api-key');
      setSettings(prev => ({
        ...prev,
        apiKey,
      }));
      toast({
        title: 'Success',
        description: 'New API key generated successfully.',
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate new API key.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingApiKey(false);
    }
  };

  // Add allowed domain for redirects
  const addAllowedDomain = () => {
    if (!domainInputValue.trim()) return;
    
    if (!settings.redirectIntegration?.allowedDomains?.includes(domainInputValue)) {
      setSettings(prev => ({
        ...prev,
        redirectIntegration: {
          ...prev.redirectIntegration,
          allowedDomains: [...(prev.redirectIntegration?.allowedDomains || []), domainInputValue],
        },
      }));
    }
    setDomainInputValue('');
  };

  // Remove allowed domain for redirects
  const removeAllowedDomain = (domain: string) => {
    setSettings(prev => ({
      ...prev,
      redirectIntegration: {
        ...prev.redirectIntegration,
        allowedDomains: prev.redirectIntegration?.allowedDomains?.filter(d => d !== domain),
      },
    }));
  };

  // Add allowed origin for API
  const addAllowedOrigin = () => {
    if (!originInputValue.trim()) return;
    
    if (!settings.allowedOrigins?.includes(originInputValue)) {
      setSettings(prev => ({
        ...prev,
        allowedOrigins: [...(prev.allowedOrigins || []), originInputValue],
      }));
    }
    setOriginInputValue('');
  };

  // Remove allowed origin for API
  const removeAllowedOrigin = (origin: string) => {
    setSettings(prev => ({
      ...prev,
      allowedOrigins: prev.allowedOrigins?.filter(o => o !== origin),
    }));
  };

  // Toggle redirect integration
  const toggleRedirectIntegration = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      redirectIntegration: {
        ...prev.redirectIntegration,
        enabled,
      },
    }));
  };

  // Toggle iframe integration
  const toggleIframeIntegration = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      iframeIntegration: {
        ...prev.iframeIntegration,
        enabled,
      },
    }));
  };

  // Copy API key to clipboard
  const copyApiKey = async () => {
    if (settings.apiKey) {
      await navigator.clipboard.writeText(settings.apiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  // Generate iframe code for the company
  const getIframeCode = () => {
    if (!settings.apiKey) return '';
    
    const iframeCode = `<iframe 
  src="${window.location.origin}/embed?api_key=${settings.apiKey}" 
  width="100%" 
  height="600px" 
  frameborder="0" 
  allow="payment" 
  title="SparrowX">
</iframe>`;
    
    return iframeCode;
  };

  // Copy iframe code to clipboard
  const copyIframeCode = async () => {
    const code = getIframeCode();
    if (code) {
      await navigator.clipboard.writeText(code);
      setIframeCodeCopied(true);
      setTimeout(() => setIframeCodeCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <ReloadIcon className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Integration Settings</h1>
      <p className="text-muted-foreground mb-6">
        Configure how your SparrowX account integrates with your website.
      </p>

      <Tabs defaultValue="api">
        <TabsList className="mb-6">
          <TabsTrigger value="api">API Integration</TabsTrigger>
          <TabsTrigger value="redirect">Redirect Integration</TabsTrigger>
          <TabsTrigger value="iframe">iFrame Integration</TabsTrigger>
        </TabsList>

        {/* API Integration */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>
                Generate API keys to authenticate your requests to the SparrowX API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-key"
                    value={settings.apiKey || 'No API key generated'}
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={copyApiKey}
                    disabled={!settings.apiKey}
                  >
                    {apiKeyCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={generateApiKey} 
                disabled={isGeneratingApiKey}
              >
                {isGeneratingApiKey && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Generate New API Key
              </Button>

              <div className="space-y-4 pt-4">
                <Label>Allowed Origins (CORS)</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://example.com"
                    value={originInputValue}
                    onChange={(e) => setOriginInputValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="secondary" onClick={addAllowedOrigin}>Add</Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  {settings.allowedOrigins?.length ? (
                    <ul className="space-y-2">
                      {settings.allowedOrigins.map((origin) => (
                        <li key={origin} className="flex justify-between items-center">
                          <span>{origin}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeAllowedOrigin(origin)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No origins added. Add domains to allow cross-origin requests.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redirect Integration */}
        <TabsContent value="redirect">
          <Card>
            <CardHeader>
              <CardTitle>Redirect Integration</CardTitle>
              <CardDescription>
                Configure how users are redirected from your website to SparrowX.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.redirectIntegration?.enabled || false}
                  onCheckedChange={toggleRedirectIntegration}
                  id="redirect-enabled"
                />
                <Label htmlFor="redirect-enabled">Enable Redirect Integration</Label>
              </div>

              <div className="space-y-4">
                <Label>Allowed Domains for Redirects</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="example.com"
                    value={domainInputValue}
                    onChange={(e) => setDomainInputValue(e.target.value)}
                    className="flex-1"
                    disabled={!settings.redirectIntegration?.enabled}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={addAllowedDomain}
                    disabled={!settings.redirectIntegration?.enabled}
                  >
                    Add
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  {settings.redirectIntegration?.allowedDomains?.length ? (
                    <ul className="space-y-2">
                      {settings.redirectIntegration.allowedDomains.map((domain) => (
                        <li key={domain} className="flex justify-between items-center">
                          <span>{domain}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeAllowedDomain(domain)}
                            disabled={!settings.redirectIntegration.enabled}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No domains added. Add domains to allow redirects from these websites.
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-4">
                  <Label>Redirect URL Example</Label>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all">
                    {window.location.origin}?company={settings.apiKey ? '[your-company-subdomain]' : '[generate-api-key-first]'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* iFrame Integration */}
        <TabsContent value="iframe">
          <Card>
            <CardHeader>
              <CardTitle>iFrame Integration</CardTitle>
              <CardDescription>
                Embed SparrowX directly into your website using an iframe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.iframeIntegration?.enabled || false}
                  onCheckedChange={toggleIframeIntegration}
                  id="iframe-enabled"
                />
                <Label htmlFor="iframe-enabled">Enable iFrame Integration</Label>
              </div>

              <div className="space-y-4">
                <Label>iFrame Embed Code</Label>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={getIframeCode()}
                    rows={6}
                    className="font-mono text-xs"
                    disabled={!settings.iframeIntegration?.enabled || !settings.apiKey}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={copyIframeCode}
                    disabled={!settings.iframeIntegration?.enabled || !settings.apiKey}
                  >
                    {iframeCodeCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>Allowed Domains for iFrame Embedding</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="example.com"
                      value={domainInputValue}
                      onChange={(e) => setDomainInputValue(e.target.value)}
                      className="flex-1"
                      disabled={!settings.iframeIntegration?.enabled}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={addAllowedDomain}
                      disabled={!settings.iframeIntegration?.enabled}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    {settings.iframeIntegration?.allowedDomains?.length ? (
                      <ul className="space-y-2">
                        {settings.iframeIntegration.allowedDomains.map((domain) => (
                          <li key={domain} className="flex justify-between items-center">
                            <span>{domain}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeAllowedDomain(domain)}
                              disabled={!settings.iframeIntegration.enabled}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        No domains added. Add domains to allow embedding in these websites.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg mt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Your website must be hosted on HTTPS to embed our application in an iframe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
} 