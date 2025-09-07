import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/client';
import { validatePhoneNumber, validateEmail } from '@/lib/clientUtils';
import { clientStorageService } from '@/lib/clientStorage';
import { toast } from 'sonner';

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialClient?: Client;
  title: string;
}

export function ClientFormModal({ open, onOpenChange, onSave, initialClient, title }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    vatDetails: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialClient) {
      setFormData({
        fullName: initialClient.fullName,
        companyName: initialClient.companyName || '',
        phoneNumber: initialClient.phoneNumber,
        emailAddress: initialClient.emailAddress || '',
        physicalAddress: initialClient.physicalAddress || '',
        vatDetails: initialClient.vatDetails || '',
        notes: initialClient.notes || ''
      });
    } else {
      setFormData({
        fullName: '',
        companyName: '',
        phoneNumber: '',
        emailAddress: '',
        physicalAddress: '',
        vatDetails: '',
        notes: ''
      });
    }
    setErrors({});
  }, [initialClient, open]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid South African phone number';
    } else if (!clientStorageService.validateUniquePhone(formData.phoneNumber, initialClient?.id)) {
      newErrors.phoneNumber = 'This phone number is already in use';
    }

    if (formData.emailAddress && !validateEmail(formData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    } else if (formData.emailAddress && !clientStorageService.validateUniqueEmail(formData.emailAddress, initialClient?.id)) {
      newErrors.emailAddress = 'This email address is already in use';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialClient ? 'Update client information' : 'Add a new client to your database'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="John Doe"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="ABC Farming (Pty) Ltd"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+27 82 123 4567"
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={(e) => handleChange('emailAddress', e.target.value)}
                placeholder="john@abcfarming.co.za"
                className={errors.emailAddress ? 'border-red-500' : ''}
              />
              {errors.emailAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.emailAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="physicalAddress">Physical Address</Label>
              <Input
                id="physicalAddress"
                value={formData.physicalAddress}
                onChange={(e) => handleChange('physicalAddress', e.target.value)}
                placeholder="123 Farm Road, Pretoria"
              />
            </div>

            <div>
              <Label htmlFor="vatDetails">VAT Details</Label>
              <Input
                id="vatDetails"
                value={formData.vatDetails}
                onChange={(e) => handleChange('vatDetails', e.target.value)}
                placeholder="VAT Number"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this client..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialClient ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
