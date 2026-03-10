import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for authentication related operations
 */
export const syncProfile = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found in request',
            });
        }

        const { email, id, user_metadata } = user;
        const fullName = user_metadata?.full_name || user_metadata?.name || 'Unknown User';
        const avatarUrl = user_metadata?.avatar_url || user_metadata?.picture || null;

        // Sync profile data in the database
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: id,
                email: email,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to sync profile',
                details: error.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Profile synced successfully',
            data,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during profile sync',
        });
    }
};
