import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useCompanyInvitation } from '../../hooks';

// Validation schema
const invitationSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Must be a valid email address' })
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

interface CompanyInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyInvitationModal: React.FC<CompanyInvitationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { sendInvitation, isSendingInvitation } = useCompanyInvitation();

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (values: InvitationFormValues) => {
    sendInvitation(values.email);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Company</DialogTitle>
          <DialogDescription>
            Enter the email address to send a company registration invitation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={onClose} 
                type="button"
                disabled={isSendingInvitation}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSendingInvitation}>
                {isSendingInvitation ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 