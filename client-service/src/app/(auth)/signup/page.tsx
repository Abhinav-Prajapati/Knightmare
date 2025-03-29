"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

import { Input } from "@/components/ui/input";
import { useAuthStore } from '@/store/auth';

// Constants
const API_BASE_URL = "http://localhost:3000";

// Types
interface ApiResponse {
  token: string;
  sub: string;
  name: string;
  email: string;
}

interface RegisterPayload {
  email: string;
  user_name: string;
  name: string;
  password_hash: string;
}

// Form validation schema
const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormFields = z.infer<typeof registerSchema>;

const formFields = [
  { name: "username", type: "text", placeholder: "Enter username" },
  { name: "email", type: "email", placeholder: "Enter email address" },
  { name: "password", type: "password", placeholder: "Enter password" },
  { name: "confirmPassword", type: "password", placeholder: "Confirm password" },
] as const;

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormFields) => {
      const payload: RegisterPayload = {
        email: data.email,
        user_name: data.username,
        name: data.username,
        password_hash: data.password
      };

      return axios.post<ApiResponse>(`${API_BASE_URL}/user/register`, payload);
    },
    onSuccess: (response) => {
      const { token, sub: id, name: username, email } = response.data;
      const user = { id, username, email };

      login(token, user);
      router.push('/');
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        setError('email', {
          type: 'manual',
          message: 'This email is already registered'
        });
      } else {
        setError('root', {
          type: 'manual',
          message: 'Registration failed. Please try again.'
        });
      }
    }
  });

  const onSubmit: SubmitHandler<RegisterFormFields> = (data) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="px-10 pt-12 pb-10 mt-5 mb-4 max-w-full rounded-2xl bg-slate-50 w-[490px] max-md:px-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <h1 className="text-4xl font-semibold text-neutral-600 text-center mb-8">
          Create Account
        </h1>

        {errors.root && (
          <div className="mb-4 p-3 text-red-500 bg-red-50 rounded-md text-center">
            {errors.root.message}
          </div>
        )}

        {formFields.map(({ name, type, placeholder }) => (
          <div key={name} className="flex flex-col mt-4">
            <span className={errors[name] ? "text-red-500" : "text-neutral-800"}>
              {errors[name]?.message || name.charAt(0).toUpperCase() + name.slice(1)}
            </span>
            <Input
              {...register(name as keyof RegisterFormFields)}
              type={type}
              placeholder={placeholder}
              className="text-md mt-1"
              autoComplete={type === "password" ? "new-password" : "off"}
            />
            <div className="h-px border border-solid bg-neutral-400 border-neutral-400 mt-1" />
          </div>
        ))}

        <button
          type="submit"
          className="justify-center items-center px-16 py-5 mt-10 text-xl rounded-[100px] 
                   text-white bg-gradient-to-r from-blue-700 to-purple-600
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:opacity-90 transition-opacity"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "CREATE ACCOUNT"}
        </button>
      </form>

      <Divider />

      <div className="flex gap-1.5 justify-center mt-7 text-[1.2rem]">
        <span className="text-neutral-500">Already have an account?</span>
        <a
          href="/signin"
          className="text-purple-500 hover:text-purple-600 transition-colors"
        >
          Sign In
        </a>
      </div>
    </div>
  );
};

const Divider: React.FC = () => (
  <div className="flex items-center gap-4 mt-7">
    <div className="flex-1 h-px bg-neutral-400" />
    <span className="text-neutral-500">OR</span>
    <div className="flex-1 h-px bg-neutral-400" />
  </div>
);

const RegisterPage: React.FC = () => (
  <div className="flex flex-col justify-center min-h-screen bg-gradient-to-tr from-[#7143E2] to-[#A348DF]">
    <div className="flex justify-center px-4 py-8 w-full">
      <RegisterForm />
    </div>
  </div>
);

export default RegisterPage;
