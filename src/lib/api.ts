import { supabase } from './supabase';

export class APILimits {
  static async canSendMessage(userId: string): Promise<boolean> {
    try {
      // First check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error checking user profile:', profileError);
        return false;
      }

      // Get limit for user's role
      const { data: limits, error: limitsError } = await supabase
        .from('api_limits')
        .select('daily_message_limit')
        .eq('role', profile.role)
        .single();

      if (limitsError) {
        console.error('Error checking API limits:', limitsError);
        return false;
      }

      // Get today's count
      const today = new Date().toISOString().split('T')[0];
      const { data: counts, error: countsError } = await supabase
        .from('message_counts')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (countsError && countsError.code !== 'PGRST116') {
        console.error('Error checking message count:', countsError);
        return false;
      }

      // If no count exists for today, initialize it
      if (!counts) {
        const { error: insertError } = await supabase
          .from('message_counts')
          .insert([
            {
              user_id: userId,
              date: today,
              count: 0
            }
          ]);

        if (insertError) {
          console.error('Error initializing message count:', insertError);
          return false;
        }

        return true;
      }

      return counts.count < limits.daily_message_limit;
    } catch (error) {
      console.error('Error checking message limit:', error);
      return false;
    }
  }

  static async incrementMessageCount(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First check if count exists for today
      const { data: existingCount, error: checkError } = await supabase
        .from('message_counts')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingCount) {
        // Insert new count
        const { error: insertError } = await supabase
          .from('message_counts')
          .insert([
            {
              user_id: userId,
              date: today,
              count: 1
            }
          ]);

        if (insertError) throw insertError;
      } else {
        // Update existing count
        const { error: updateError } = await supabase
          .from('message_counts')
          .update({ count: existingCount.count + 1 })
          .eq('user_id', userId)
          .eq('date', today);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error incrementing message count:', error);
      throw error;
    }
  }

  static async getDailyStats(userId: string) {
    try {
      // Get user's role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get limit for user's role
      const { data: limits, error: limitsError } = await supabase
        .from('api_limits')
        .select('daily_message_limit')
        .eq('role', profile.role)
        .single();

      if (limitsError) throw limitsError;

      // Get today's count
      const today = new Date().toISOString().split('T')[0];
      const { data: counts, error: countsError } = await supabase
        .from('message_counts')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      // Initialize count if it doesn't exist
      if (countsError && countsError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('message_counts')
          .insert([
            {
              user_id: userId,
              date: today,
              count: 0
            }
          ]);

        if (insertError) throw insertError;

        return {
          limit: limits.daily_message_limit,
          used: 0,
          remaining: limits.daily_message_limit
        };
      }

      if (countsError) throw countsError;

      return {
        limit: limits.daily_message_limit,
        used: counts?.count || 0,
        remaining: limits.daily_message_limit - (counts?.count || 0)
      };
    } catch (error) {
      console.error('Error getting daily stats:', error);
      throw error;
    }
  }

  static async updateLimit(role: 'user' | 'admin', limit: number) {
    try {
      const { error } = await supabase
        .from('api_limits')
        .update({ daily_message_limit: limit })
        .eq('role', role);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating limit:', error);
      throw error;
    }
  }
}